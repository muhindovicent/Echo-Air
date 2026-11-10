# Concept asset provenance

These are the **unmodified** stock frames that were hot-linked by the legacy
prototype (`legacy/index.html`, `legacy/Echo and Air.html`). They are kept here
for provenance and so the crop step is reproducible.

They are **not** Echo & Air brand photography. They are third-party stock
photographs, several of which show other brands' products or logos. That is
precisely why `tools/crop_concept_assets.py` crops them to regions that
exclude those marks before they are published to `public/concept/`.

| File            | Source                                        | Note                                |
| --------------- | --------------------------------------------- | ----------------------------------- |
| `campaign.jpg`  | `images.unsplash.com/photo-1529139574466-a303027c1d8b` | Graphic tee print |
| `denim.jpg`     | `images.unsplash.com/photo-1542272604-787c3835535d`   | Visible brand patches |
| `jacket.jpg`    | `images.unsplash.com/photo-1551028719-00167b16eac5`   | Visible retailer label |
| `jersey.jpg`    | `images.unsplash.com/photo-1618354691373-d851c5c3a990` | Chest print       |
| `look-01.jpg`   | `images.unsplash.com/photo-1583743814966-8936f5b7be1a` | Chest print       |
| `look-02.jpg`   | `images.unsplash.com/photo-1509631179647-0177331693ae` | Editorial frame    |
| `look-04.jpg`   | `images.unsplash.com/photo-1515886657613-9f3515b0c78f` | Full-length frame  |
| `runner.jpg`    | `images.unsplash.com/photo-1542291026-7eec264c27ff`   | Visible brand mark |
| `sweatshirt.jpg`| `images.unsplash.com/photo-1556906781-9a412961c28c`   | Visible brand mark |
| `tee.jpg`       | `images.unsplash.com/photo-1521572163474-6864f9cf17ab` | Clean frame        |

Two further legacy URLs are already dead upstream and are therefore not
available at all: `photo-1558618666-fcd25c85f82e` and
`photo-1434389677669-e08b4cda3a3e`.

Regenerate the published frames with:

```bash
python tools/crop_concept_assets.py
```
