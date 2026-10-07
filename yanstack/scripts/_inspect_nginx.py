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
set -e
echo '=== nginx sites ==='
ls -la /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null || true
echo '=== find server_name ==='
sudo grep -RIn "server_name\|listen\|proxy_pass\|yanstack\|124.220" /etc/nginx/ 2>/dev/null | head -80
echo '=== curl local ==='
curl -sI -H 'Host: yanstack.cn' http://127.0.0.1/ | head -15
curl -sI http://127.0.0.1/ | head -8
"""
_i, o, e = c.exec_command(cmd, timeout=40)
print(o.read().decode("utf-8", "replace"))
print(e.read().decode("utf-8", "replace")[-500:])
c.close()
