import paramiko
from pathlib import Path

HOST = "124.220.179.231"
KEY = str(Path.home() / ".ssh" / "id_ed25519_yanstack")
ROOT = Path(r"E:/工作/考研资料网页售卖平台/yanstack")

FILES = [
    "src/lib/presence.ts",
    "src/lib/visits.ts",
    "src/lib/auth.ts",
    "src/components/presence-tracker.tsx",
    "src/app/api/presence/route.ts",
    "src/components/online-monitor.tsx",
]


def run(client, cmd, timeout=900):
    print(">>>", cmd[:200].replace("\n", " "))
    _i, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if out:
        print(out[-3500:] if len(out) > 3500 else out)
    if err:
        print("ERR", err[-800:])
    print("exit", code)
    return code


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="ubuntu", key_filename=KEY, timeout=20)
    sftp = client.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        remote = f"/home/ubuntu/yanstack/{rel}"
        print("put", rel)
        sftp.put(str(local), remote)
    sftp.close()

    # estimate historical PV from nginx access log if any
    run(
        client,
        r"""
set -e
echo '=== nginx pv estimate ==='
for f in /var/log/nginx/access.log /var/log/nginx/access.log.1; do
  if [ -f "$f" ]; then
    echo -n "$f front hits: "
    # count non-admin HTML-ish GETs roughly
    grep -E 'GET /(products| |$|\?)' "$f" 2>/dev/null | grep -v '/admin' | grep -v '/api/' | wc -l || true
    echo -n "$f total GET: "
    grep -c 'GET ' "$f" 2>/dev/null || true
  fi
done
""",
        timeout=60,
    )

    code = run(
        client,
        r"""
set -e
cd /home/ubuntu/yanstack
npm run build
sudo systemctl restart yanstack
sleep 2
sudo systemctl is-active yanstack
# keep current front_pv, do not touch db file
node <<'NODE'
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const row=await p.siteSetting.findUnique({where:{key:'front_pv'}});
  console.log('front_pv', row?.value);
  await p.$disconnect();
})();
NODE
curl -s http://127.0.0.1:3000/api/presence
echo
echo DEPLOY_DONE
""",
        timeout=900,
    )
    client.close()
    raise SystemExit(code)


if __name__ == "__main__":
    main()
