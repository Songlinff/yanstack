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
find /tmp/yanstack-new -name 'dev.db' 2>/dev/null
cd /home/ubuntu/yanstack
# try read from any found dbs
for f in /tmp/yanstack-new/yanstack/prisma/dev.db /home/ubuntu/yanstack/prisma/dev.db; do
  if [ -f "$f" ]; then
    echo "== $f =="
    node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient({datasources:{db:{url:'file:$f'}}});
p.siteSetting.findUnique({where:{key:'front_pv'}}).then(r=>{console.log(r); return p.\$disconnect();});
" 2>/dev/null || sqlite3 "$f" "select key,value from SiteSetting where key='front_pv';" 2>/dev/null || echo no-sqlite
  fi
done
# journal/wal?
ls -la /home/ubuntu/yanstack/prisma/
"""
_i, o, e = c.exec_command(cmd, timeout=40)
print(o.read().decode("utf-8", "replace"))
print(e.read().decode("utf-8", "replace")[-500:])
c.close()
