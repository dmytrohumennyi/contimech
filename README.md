# ContiMech website

Static website for ContiMech.

Stage 3 update:
- reduced founder-centric positioning;
- added Engineering page to navigation;
- repositioned ContiMech as a robotics, automation, embedded systems, and documentation-ready engineering initiative;
- added technical canvas: mechanics, PCB, firmware, desktop software, ROS 2, model-based design, QA, and process support;
- preserved role-based team model without publishing private staff data.

## Stage 6 note
`projects.html` is now a protected-repository gateway. Old public project pages and case PDFs were removed from this package. When deploying to GitHub Pages or another static host, delete stale files from the previous deployment so old URLs are not left publicly accessible.


## Stage 7 — Protected Projects Portal

`projects.html` is now an authorization gateway. It does not contain project data or project files.

The folder `project-portal-backend/` contains a backend reference implementation for protected project tiles and slide delivery. For real deployment, private project files must be stored outside the public static website, for example in a private S3 bucket.
