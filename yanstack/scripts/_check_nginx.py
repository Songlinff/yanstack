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
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || ls -la /etc/nginx/conf.d/ 2>/dev/null
echo '=== current conf snippets ==='
sudo grep -Rni 'server_name\|proxy_pass\|listen' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | head -80
echo '=== curl local ==='
curl -sI -H 'Host: yanstack.cn' http://127.0.0.1/ | head -n 15 || true
curl -sI http://127.0.0.1:3000/ | head -n 5 || true
"""
_i, o, e = c.exec_command(cmd, timeout=40)
print(o.read().decode("utf-8", "replace"))
err = e.read().decode("utf-8", "replace")
if err:
    print("ERR", err[-500:])
c.close()
