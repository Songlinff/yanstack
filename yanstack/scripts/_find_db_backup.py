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
ls -la /home/ubuntu/*.db /home/ubuntu/yanstack/prisma/*.db* /tmp/*.db 2>/dev/null
ls -la /home/ubuntu/yanstack-resync* 2>/dev/null | head
# search backups
find /home/ubuntu -name 'dev.db*' 2>/dev/null | head -20
find /tmp -name '*yanstack*' 2>/dev/null | head -20
"""
_i, o, e = c.exec_command(cmd, timeout=30)
print(o.read().decode())
c.close()
