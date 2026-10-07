import re
import urllib.request
from pathlib import Path

import paramiko

html = urllib.request.urlopen("http://124.220.179.231/products", timeout=20).read().decode(
    "utf-8", "replace"
)
slugs = set(re.findall(r"/products/(qk-[a-z0-9-]+)", html))
print("products_page_ok", "HTTP")
print("qk_slugs_on_list", len(slugs))
print("has_mock_hint", ("押题" in html) or ("冲刺" in html))

key = str(Path.home() / ".ssh" / "id_ed25519_yanstack")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("124.220.179.231", username="ubuntu", key_filename=key, timeout=20)
cmd = (
    "cd ~/yanstack && node -e "
    "\"const {PrismaClient}=require('@prisma/client');"
    "const p=new PrismaClient();"
    "Promise.all([p.product.count(),p.product.count({where:{isPublished:true}})])"
    ".then(([t,b])=>{console.log(JSON.stringify({total:t,published:b}));return p.\\$disconnect();})\""
)
# simpler sqlite query
cmd = 'sqlite3 ~/yanstack/prisma/dev.db "select count(*) from Product; select count(*) from Product where isPublished=1;"'
_stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
print("db", stdout.read().decode())
err = stderr.read().decode()
if err:
    print("err", err[-300:])
_stdin, stdout, stderr = client.exec_command(
    "sudo systemctl is-active yanstack; curl -sI http://127.0.0.1:3000 | head -n 1",
    timeout=20,
)
print(stdout.read().decode())
client.close()
print("KEY_AUTH_OK")
