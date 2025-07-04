"# dc-test" 
安装cf命令工具
npm install -g wrangler
本地启动
wrangler dev


curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer FoumzcTZ0HR25ihgV9n8aivnprslXAk08f1nRc6j"


数据库查询
curl --location 'https://api.cloudflare.com/client/v4/accounts/fa95f67de9ea4a42025f611d5401113d/d1/database/8a6b9855-b253-4db9-997a-c311db1585b6/query' \
--header 'Authorization: Bearer FoumzcTZ0HR25ihgV9n8aivnprslXAk08f1nRc6j' \
--header 'Content-Type: application/json' \
--data '{
    "sql": "SELECT * FROM user WHERE id = ?;",
    "params": [
        "1"
    ]
}'

部署带一致性对象的项目
npm create cloudflare@latest -- durable-object-starter

npm create cloudflare@latest -- --template=cloudflare/templates/hello-world-do-template
