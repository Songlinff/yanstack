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

# read current config
_i, o, e = c.exec_command("sudo cat /etc/nginx/sites-available/yanstack", timeout=20)
old = o.read().decode()
print("OLD CONFIG:\n", old)

new = """server {
    listen 80;
    server_name yanstack.cn www.yanstack.cn 124.220.179.231;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
"""

# write via sftp to tmp then sudo cp
sftp = c.open_sftp()
with sftp.file("/tmp/yanstack.nginx.conf", "w") as f:
    f.write(new)
sftp.close()

cmd = r"""
set -e
sudo cp /tmp/yanstack.nginx.conf /etc/nginx/sites-available/yanstack
sudo nginx -t
sudo systemctl reload nginx
# update app public url if present
cd /home/ubuntu/yanstack
if grep -q '^NEXT_PUBLIC_APP_URL=' .env; then
  sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL="http://yanstack.cn"|' .env
else
  printf '\nNEXT_PUBLIC_APP_URL="http://yanstack.cn"\n' >> .env
fi
grep NEXT_PUBLIC_APP_URL .env
# restart app so env takes effect (URL mostly client-build-time; restart anyway)
sudo systemctl restart yanstack
sleep 2
sudo systemctl is-active yanstack
echo '=== test by host ==='
curl -sI -H 'Host: yanstack.cn' http://127.0.0.1/ | head -8
curl -sI -H 'Host: www.yanstack.cn' http://127.0.0.1/ | head -8
echo DONE
"""
_i, o, e = c.exec_command(cmd, timeout=60)
print(o.read().decode("utf-8", "replace"))
err = e.read().decode("utf-8", "replace")
if err:
    print("ERR", err[-800:])
c.close()
