"""Upload auth fix, set COOKIE_SECURE=0, rebuild and restart."""
from __future__ import annotations

import json
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path

import paramiko

HOST = "124.220.179.231"
USER = "ubuntu"
KEY = str(Path.home() / ".ssh" / "id_ed25519_yanstack")
LOCAL_AUTH = Path(r"E:/工作/考研资料网页售卖平台/yanstack/src/lib/auth.ts")
REMOTE_AUTH = "/home/ubuntu/yanstack/src/lib/auth.ts"


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 900) -> tuple[int, str, str]:
    print(">>>", cmd[:200].replace("\n", " "))
    _stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if out:
        print(out[-5000:] if len(out) > 5000 else out)
    if err:
        print("ERR", err[-1500:] if len(err) > 1500 else err)
    print("exit", code)
    return code, out, err


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY, timeout=20)
    print("connected")

    run(client, "grep -E 'NODE_ENV|APP_URL|SITE|COOKIE|ADMIN_' ~/yanstack/.env || true")
    run(client, "sed -n '1,60p' /etc/systemd/system/yanstack.service")

    sftp = client.open_sftp()
    sftp.put(str(LOCAL_AUTH), REMOTE_AUTH)
    sftp.close()
    print("uploaded auth.ts")

    # ensure COOKIE_SECURE=0 in .env
    run(
        client,
        r"""
set -e
cd /home/ubuntu/yanstack
if grep -q '^COOKIE_SECURE=' .env; then
  sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=0/' .env
else
  printf '\nCOOKIE_SECURE=0\n' >> .env
fi
# normalize admin email docs vs invalid admin@yanstack
if grep -q '^ADMIN_EMAIL="admin@yanstack"' .env; then
  sed -i 's/^ADMIN_EMAIL="admin@yanstack"/ADMIN_EMAIL="admin@yanstack.local"/' .env
fi
grep -E 'COOKIE_SECURE|ADMIN_EMAIL' .env
""",
    )

    code, _, _ = run(
        client,
        """
set -e
cd /home/ubuntu/yanstack
npm run build
sudo systemctl restart yanstack
sleep 2
sudo systemctl is-active yanstack
""",
        timeout=900,
    )
    if code != 0:
        raise SystemExit(code)

    # verify cookie is no longer Secure
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    req = urllib.request.Request(
        f"http://{HOST}/api/auth",
        data=json.dumps(
            {
                "action": "login",
                "email": "admin@yanstack.local",
                "password": "Admin123456",
            }
        ).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with opener.open(req, timeout=20) as resp:
        print("login", resp.status, resp.read().decode()[:200])
        for k, v in resp.headers.items():
            if k.lower() == "set-cookie":
                print("Set-Cookie:", v)
    for c in cj:
        print("cookie", c.name, "secure=", c.secure)

    with opener.open(f"http://{HOST}/api/auth?action=me", timeout=20) as resp:
        print("me_via_get_maybe", resp.status)

    # session check via admin API if any
    req2 = urllib.request.Request(
        f"http://{HOST}/api/auth",
        data=json.dumps({"action": "me"}).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    try:
        with opener.open(req2, timeout=20) as resp:
            print("me", resp.status, resp.read().decode()[:300])
    except Exception as e:
        body = e.read().decode() if hasattr(e, "read") else str(e)
        print("me_err", body[:300])

    client.close()
    print("DONE")


if __name__ == "__main__":
    main()
