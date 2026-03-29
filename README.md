# PubgStatAi

PUBG live overlay Streamlabs-hez / OBS-hez, Cloudflare Pages Functions backenddel.

## Fájlstruktúra

```
PubgStatAi/
  functions/
    api.js          <- Cloudflare Pages Functions (PUBG proxy)
  public/
    index.html      <- Overlay frontend (Streamlabs / OBS Browser Source)
  _headers          <- Biztonsági HTTP headerek
  README.md
```

## GitHub feltöltés

```bash
cd /Users/farkasfarek/Desktop/PubgStatAi
git init
git add .
git commit -m "init: PUBG live overlay"
git branch -M main
git remote add origin https://github.com/FarkasFarek/pubg-stat-ai.git
git push -u origin main
```

## Cloudflare Pages deploy

1. Cloudflare Dashboard → Pages → Create a project
2. Connect to Git → válaszd a pubg-stat-ai repót
3. Build settings:
   - Framework preset: **None**
   - Build command: **(üres)**
   - Build output directory: **public**
4. Environment variables:
   - `PUBG_API_KEY` = a PUBG developer API kulcsod
5. Save and Deploy

## Browser Source URL (OBS / Streamlabs)

```
https://<projekted>.pages.dev/
```

Szélesség: 1920, Magasság: 1080, Háttér: átlátszó
