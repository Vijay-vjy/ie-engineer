# Vignesh Prabhu .S — Industrial Engineering website

Plain HTML/CSS/JS. No build step. Open `index.html` in a browser to preview.

## Pages
| File | Content |
|---|---|
| index.html | Hero, key numbers, services, calculator promo, buyers & audits, CTA |
| about.html | Summary, impact, career timeline, case studies, skills, credentials, resume download |
| sam-calculator.html | Operation SAM · Garment SAM · Production planning, worked example, formulas, FAQ |
| contact.html | Contact form + contact details |

## Things to edit before going live
1. **Contact details** – `assets/js/main.js`, the `SITE` block at the top (email, phone, WhatsApp, LinkedIn).
   They update on every page automatically.
2. **Contact form** – create a free form at https://formspree.io, paste its URL into `SITE.formEndpoint`.
   Until then the form opens the visitor's email app with the message filled in.
3. **Photo (optional)** – save as `assets/images/profile.jpg`, then uncomment the `<img class="photo">` line in `about.html`.
4. **Domain** – replace `YOUR-DOMAIN.com` in `robots.txt` and `sitemap.xml`.
5. **Resume** – replace `assets/docs/resume.pdf` whenever you update it.

## Structure
```
index.html  about.html  sam-calculator.html  contact.html  favicon.png
assets/css/style.css         common + home/about/contact styles
assets/css/calculator.css    calculator page styles
assets/js/main.js            site settings, menu, animations
assets/js/export.js          copy / Excel (CSV) / PDF helpers
assets/js/sam-calculator.js  operation SAM + tabs
assets/js/garment-sam.js     garment operation list, total, machine split
assets/js/planning.js        target output, operators required, line efficiency
assets/js/contact.js         form validation + sending
assets/images/               logo-mark.png, logo-full.png
assets/docs/resume.pdf
```

## Free hosting
- **Netlify**: drag the folder onto app.netlify.com/drop
- **GitHub Pages**: push to a repo → Settings → Pages → deploy from main branch
