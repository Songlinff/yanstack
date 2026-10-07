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
echo '=== from server to public www ==='
curl -sI --resolve www.yanstack.cn:80:124.220.179.231 http://www.yanstack.cn/ | head -n 15
curl -sI http://www.yanstack.cn/ | head -n 15
echo '=== dig ==='
dig +short yanstack.cn A || getent hosts yanstack.cn
dig +short www.yanstack.cn A || getent hosts www.yanstack.cn
echo '=== listen 80 ==='
sudo ss -lntp | grep ':80\|:3000' || netstat -lntp 2>/dev/null | grep ':80\|:3000'
"""
_i, o, e = c.exec_command(cmd, timeout=40)
print(o.read().decode("utf-8", "replace"))
print(e.read().decode("utf-8", "replace")[-400:])
c.close()
