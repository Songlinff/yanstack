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
script = r"""
cd /home/ubuntu/yanstack
node <<'NODE'
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const rows=await p.siteSetting.findMany();
  console.log('settings', JSON.stringify(rows,null,2));
  await p.$disconnect();
})().catch(e=>{console.error(e); process.exit(1);});
NODE
echo '---'
curl -s http://127.0.0.1:3000/api/presence
echo
"""
_stdin, stdout, stderr = c.exec_command(script, timeout=40)
print(stdout.read().decode("utf-8", "replace"))
err = stderr.read().decode("utf-8", "replace")
if err:
    print("ERR", err[-800:])
c.close()
