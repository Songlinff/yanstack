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
cmd = r'''
# approximate HTML page views (exclude api/static/_next/admin)
for f in /var/log/nginx/access.log /var/log/nginx/access.log.1; do
  [ -f "$f" ] || continue
  echo "== $f =="
  awk '$6 ~ /"GET/ {
    url=$7
    if (url ~ /^\/api\//) next
    if (url ~ /^\/_next\//) next
    if (url ~ /^\/admin/) next
    if (url ~ /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|map|txt|xml)(\?|$)/) next
    c++
  } END {print c+0}' "$f"
done

cd /home/ubuntu/yanstack
# restore floor: use max(current, nginx html estimate). App PV counts SPA navigations too,
# nginx undercounts client-side transitions but overcounts crawlers — take nginx sum as floor.
node <<'NODE'
const {PrismaClient}=require('@prisma/client');
const {execSync}=require('child_process');
const p=new PrismaClient();
function countLog(f){
  try {
    return Number(execSync(`awk '$6 ~ /"GET/ { url=$7; if (url ~ /^\\/api\\//) next; if (url ~ /^\\/_next\\//) next; if (url ~ /^\\/admin/) next; if (url ~ /\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|map|txt|xml)(\\?|$)/) next; c++ } END {print c+0}' ${f}`, {encoding:'utf8'}).trim())||0;
  } catch { return 0; }
}
(async()=>{
  const n1=countLog('/var/log/nginx/access.log');
  const n2=countLog('/var/log/nginx/access.log.1');
  const floor=n1+n2;
  const row=await p.siteSetting.findUnique({where:{key:'front_pv'}});
  const cur=Number(row?.value||0)||0;
  const next=Math.max(cur, floor);
  await p.siteSetting.upsert({
    where:{key:'front_pv'},
    create:{key:'front_pv', value:String(next)},
    update:{value:String(next)},
  });
  console.log(JSON.stringify({n1,n2,floor,cur,next}));
  await p.$disconnect();
})();
NODE
'''
_i, o, e = c.exec_command(cmd, timeout=60)
print(o.read().decode())
print(e.read().decode()[-400:])
c.close()
