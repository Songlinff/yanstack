"""Deploy claim-stats changes to remote server."""
from __future__ import annotations

from pathlib import Path

import paramiko

HOST = "124.220.179.231"
USER = "ubuntu"
KEY = str(Path.home() / ".ssh" / "id_ed25519_yanstack")
ROOT = Path(r"E:/工作/考研资料网页售卖平台/yanstack")

FILES = [
    "prisma/schema.prisma",
    "prisma/dev.db",
    "src/app/api/claim/route.ts",
    "src/components/product-card.tsx",
    "src/components/admin-shell.tsx",
    "src/app/products/[slug]/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/claims/page.tsx",
    "src/lib/auth.ts",
]


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 900) -> int:
    print(">>>", cmd[:220].replace("\n", " "))
    _i, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if out:
        print(out[-4000:] if len(out) > 4000 else out)
    if err:
        print("ERR", err[-1000:])
    print("exit", code)
    return code


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY, timeout=20)
    sftp = client.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        remote = f"/home/ubuntu/yanstack/{rel.replace(chr(92), '/')}"
        if not local.exists():
            raise SystemExit(f"missing {local}")
        # ensure remote dir
        remote_dir = "/".join(remote.split("/")[:-1])
        run(client, f"mkdir -p {remote_dir}")
        print("put", rel)
        sftp.put(str(local), remote)
    sftp.close()

    code = run(
        client,
        """
set -e
cd /home/ubuntu/yanstack
# keep remote .env; ensure cookie fix still present
grep -q '^COOKIE_SECURE=' .env || printf '\\nCOOKIE_SECURE=0\\n' >> .env
npx prisma generate
npx prisma db push --skip-generate
npm run build
sudo systemctl restart yanstack
sleep 2
sudo systemctl is-active yanstack
curl -sI http://127.0.0.1:3000/admin/claims | head -n 5
echo DEPLOY_DONE
""",
        timeout=900,
    )
    client.close()
    raise SystemExit(code)


if __name__ == "__main__":
    main()
