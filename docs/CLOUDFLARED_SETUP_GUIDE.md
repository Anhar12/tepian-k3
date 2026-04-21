# Cloudflare Tunnel Setup Guide

Expose the tepian-k3 web container on your custom domain using Cloudflare Tunnel — no open firewall ports, no reverse-proxy config.

---

## Your Current DNS Chain

```
Browser → Vercel nameservers (ns1/ns2.vercel-dns.com)
              └── manages all DNS for the domain
                      ↑
            registered at Hostinger (registrar only)
```

Because Vercel is acting as your **nameserver** (not just a deployment target), it owns your entire DNS zone. Cloudflare's scan in Step 1 will likely come back empty — you will need to add records manually.

After this guide the chain becomes:

```
Browser → Cloudflare nameservers → Cloudflare Tunnel → Docker web container
```

> **Keeping Vercel for other projects?** You can still point specific subdomains at Vercel from Cloudflare DNS — see the last section.

---

## Step 1 — Add Your Domain to Cloudflare

1. Sign up or log in at **cloudflare.com**
2. Click **Add a Site** → enter your domain → choose the **Free** plan
3. Cloudflare tries to scan existing DNS records — because Vercel owns the zone it will likely find nothing. That is expected — you will add records manually after switching nameservers.
4. Cloudflare gives you **two nameservers**, e.g.:
   ```
   aria.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
   Keep this tab open.

---

## Step 2 — Switch Nameservers at Hostinger

1. Log in to **Hostinger hPanel**
2. Go to **Domains** → click your domain → **DNS / Nameservers**
3. Select **Change nameservers** (custom)
4. Replace the current Vercel nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) with the two Cloudflare ones from Step 1
5. Save

Propagation takes **a few minutes to 48 hours**. Cloudflare emails you when the change is detected.

> After this step Vercel loses control of your DNS. Your domain will return no results until you add records in Cloudflare (next steps). Expect a short downtime window.

---

## Step 3 — Add DNS Records in Cloudflare

Since Vercel held your zone privately, you need to recreate any records you still want.

**For the Cloudflare Tunnel (tepian-k3 web app):**
Cloudflare automatically adds a CNAME for the tunnel's public hostname when you configure it in Step 5 — nothing to do here for the tunnel itself.

**For email / MX records:**
If your domain had email (e.g. from Hostinger or Google Workspace), re-add those MX and TXT records now. Check your old records in Hostinger's email panel or ask your email provider.

**For anything still on Vercel (other projects):**
See the last section of this guide.

---

## Step 4 — Create a Cloudflare Tunnel

1. In the Cloudflare dashboard, open **Zero Trust** (left sidebar)
2. Go to **Networks → Tunnels → Create a tunnel**
3. Choose **Cloudflared** as the connector type
4. Name the tunnel (e.g. `tepian-k3-web`)
5. On the install-connector screen, **ignore the commands** — Docker handles the connector
6. Copy the **Tunnel Token** — it looks like a long base64 string

---

## Step 5 — Configure the Public Hostname

Still in the tunnel settings:

1. Click **Public Hostnames → Add a public hostname**
2. Fill in:

   | Field        | Value                       |
   | ------------ | --------------------------- |
   | Subdomain    | leave blank (root) or `app` |
   | Domain       | `yourdomain.com`            |
   | Service Type | `HTTP`                      |
   | URL          | `web:80`                    |

3. Save the tunnel

Cloudflare automatically adds the required DNS CNAME for this hostname.

> `web:80` is the internal Docker service name and port — cloudflared reaches it on the compose network directly, no `localhost` or port-mapping needed.

---

## Step 6 — Add the Token to .env

```env
# .env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiY...your-token-here
```

---

## Step 7 — Run the Stack

```bash
# Web only + tunnel
docker compose -f docker-compose.web.yml -f docker-compose.cloudflared.yml --profile tunnel up -d

# All-in-one (infra + server + web) + tunnel
docker compose -f docker-compose.yml -f docker-compose.cloudflared.yml --profile tunnel up -d

# Pre-built prod images + tunnel
docker compose -f docker-compose.prod.yml -f docker-compose.cloudflared.yml --profile tunnel up -d
```

Check tunnel status:

```bash
docker compose -f docker-compose.web.yml -f docker-compose.cloudflared.yml logs cloudflared
```

Look for `Connection registered` — your site is live at `https://yourdomain.com`.

---

## Quick Tunnel (testing only — no account needed)

```bash
docker compose -f docker-compose.web.yml -f docker-compose.cloudflared.yml --profile tunnel-quick up -d

# Get the generated URL
docker compose -f docker-compose.web.yml -f docker-compose.cloudflared.yml logs cloudflared-quick
```

Look for:

```
Your quick Tunnel has been created! Visit it at: https://xxxx-xxxx.trycloudflare.com
```

---

## Keeping Vercel for Other Projects

After moving nameservers to Cloudflare, add these records in the Cloudflare DNS panel for any subdomain still deployed on Vercel:

| Type  | Name        | Value                  | Proxy status          |
| ----- | ----------- | ---------------------- | --------------------- |
| CNAME | `www`       | `cname.vercel-dns.com` | DNS only (grey cloud) |
| CNAME | `other-app` | `cname.vercel-dns.com` | DNS only (grey cloud) |

Then in your Vercel project settings, add the subdomain as a custom domain — Vercel will verify the CNAME and issue its own TLS certificate.

> Keep these records **DNS only** (grey cloud, not proxied). Vercel handles TLS itself and breaks if Cloudflare proxies it.

---

## Troubleshooting

| Symptom                               | Likely cause                        | Fix                                        |
| ------------------------------------- | ----------------------------------- | ------------------------------------------ |
| Site shows Cloudflare error 1033      | Tunnel container not running        | `docker compose ... logs cloudflared`      |
| `CLOUDFLARE_TUNNEL_TOKEN is required` | Missing env var                     | Add token to `.env`                        |
| `web:80` connection refused           | Web container not healthy           | `docker compose ... ps`                    |
| Domain returns nothing after switch   | Nameservers not propagated yet      | Wait; run `dig NS yourdomain.com` to check |
| Old Vercel site still showing         | Browser cache                       | Clear cache or try incognito               |
| Vercel custom domain shows TLS error  | CNAME set to proxied (orange cloud) | Switch it to DNS only in Cloudflare        |
