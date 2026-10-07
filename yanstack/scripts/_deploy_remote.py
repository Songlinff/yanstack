import paramiko
from pathlib import Path

HOST = "124.220.179.231"
USER = "ubuntu"
PWD = Path(r"C:/Users/Administrator/.ssh/yanstack_pw.txt").read_text(encoding="utf-8").strip()
ZIP = Path(r"E:/工作/考研资料网页售卖平台/yanstack-resync.zip")
PUB = Path(r"C:/Users/Administrator/.ssh/id_ed25519_yanstack.pub").read_text(encoding="utf-8").strip()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PWD, timeout=30)
print("connected")


def run(cmd: str, timeout: int = 900):
    print(">>>", cmd[:180].replace("\n", " "))
    _stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if out:
        print(out[-4000:] if len(out) > 4000 else out)
    if err:
        print("ERR", err[-1500:] if len(err) > 1500 else err)
    print("exit", code)
    return code, out, err


run(
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && "
    "chmod 600 ~/.ssh/authorized_keys && "
    f"grep -qxF '{PUB}' ~/.ssh/authorized_keys || echo '{PUB}' >> ~/.ssh/authorized_keys && echo KEY_OK"
)

sftp = client.open_sftp()
remote_zip = "/home/ubuntu/yanstack-resync.zip"
print("uploading", ZIP.stat().st_size)
sftp.put(str(ZIP), remote_zip)
print("uploaded")
sftp.close()

deploy = r"""
set -e
cd /home/ubuntu
sudo systemctl stop yanstack || true
cp -a yanstack/.env /tmp/yanstack.env.bak
rm -rf /tmp/yanstack-new
mkdir -p /tmp/yanstack-new
unzip -oq yanstack-resync.zip -d /tmp/yanstack-new
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude node_modules --exclude .next --exclude .env /tmp/yanstack-new/yanstack/ /home/ubuntu/yanstack/
else
  # fallback without rsync
  find /home/ubuntu/yanstack -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .next ! -name .env -exec rm -rf {} +
  cp -a /tmp/yanstack-new/yanstack/. /home/ubuntu/yanstack/
fi
cp -a /tmp/yanstack.env.bak /home/ubuntu/yanstack/.env
sudo chown -R ubuntu:ubuntu /home/ubuntu/yanstack
cd /home/ubuntu/yanstack
npm install --prefer-offline
npx prisma generate
npm run build
sudo systemctl start yanstack
sleep 3
sudo systemctl is-active yanstack
curl -sI http://127.0.0.1:3000 | head -n 8
echo DEPLOY_DONE
"""

code, _out, _err = run(deploy, timeout=900)
client.close()
raise SystemExit(code)
