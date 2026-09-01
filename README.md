Personal Site

NextJS static site using:

- Typescript
- React
- glsl for custom shaders

## Résumé

`Ron_Rounsifer_Resume.md` is the source of truth for the résumé. The `/resume/`
route renders it as responsive HTML on small screens and embeds the generated
PDF on desktop. `npm run resume:pdf` writes the downloadable PDF to `public/`;
the normal `dev` and `build` commands run that step automatically.
