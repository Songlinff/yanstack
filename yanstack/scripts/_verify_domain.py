import paramiko
from pathlib import Path

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(
    "124.220.179.231",
    username="ubuntu",
    key_filename=str(Path.home() / ".ssh" / "id_ed25519_yanstack"),
    timeout=20,
)
cmd = r"""
curl -sI http://127.0.0.1/ -H 'Host: yanstack.cn' | head -n 12
echo '---'
curl -sI http://yanstack.cn/ | head -n 12 || true
echo '---'
grep -E 'APP_URL|SITE_NAME|COOKIE' /home/ubuntu/yanstack/.env
sudo systemctl is-active yanstack nginx
"""
_i, o, e = c.exec_command(cmd, timeout=30)
print(o.read().decode("utf-8", "replace"))
print(e.read().decode("utf-8", "replace")[-300:])
c.close()
