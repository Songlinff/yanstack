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
echo '=== full nginx ==='
sudo cat /etc/nginx/sites-available/yanstack
echo
echo '=== app url ==='
grep -E 'APP_URL|SITE|COOKIE' /home/ubuntu/yanstack/.env || true
"""
_i, o, e = c.exec_command(cmd, timeout=20)
print(o.read().decode("utf-8", "replace"))
c.close()
