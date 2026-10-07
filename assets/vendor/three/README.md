# Three.js Runtime

Version: 0.186.0, MIT license (see LICENSE).

Copied without modification from the installed npm package's build/three.module.js and build/three.core.js.
Both files are required because the module imports the core using a relative path.
These files and `footer-runtime.min.js` are retained from the previous topology
footer. The current word-sea footer in `scripts/footer-field.js` uses native WebGL2
and does not import or download them.

`npm run build:footer` can still regenerate the legacy runtime. The site build no
longer rebuilds it; these files and the MIT license remain for source attribution.

Source and documentation: https://threejs.org/

When updating these legacy dependencies, replace both upstream files together.
