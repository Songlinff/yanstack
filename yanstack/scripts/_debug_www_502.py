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
echo '=== host www / ==='
curl -sI -H 'Host: www.yanstack.cn' http://127.0.0.1/ | head -n 10
echo '=== host www /products ==='
curl -sI -H 'Host: www.yanstack.cn' http://127.0.0.1/products | head -n 15
echo '=== host apex /products ==='
curl -sI -H 'Host: yanstack.cn' http://127.0.0.1/products | head -n 15
echo '=== direct node ==='
curl -sI http://127.0.0.1:3000/products | head -n 10
echo '=== nginx error ==='
sudo tail -n 40 /var/log/nginx/error.log
echo '=== app status ==='
sudo systemctl status yanstack --no-pager -l | head -n 25
"""
_i, o, e = c.exec_command(cmd, timeout=40)
print(o.read().decode("utf-8", "replace"))
print(e.read().decode("utf-8", "replace")[-500:])
c.close()
