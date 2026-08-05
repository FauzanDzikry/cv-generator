# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cv-preview-pagination.spec.ts >> CV Preview & Pagination Regression >> preview is visible beside form and paginates deterministically without early breaks
- Location: tests\e2e\cv-preview-pagination.spec.ts:13:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "sticky"
Received: "static"
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e6]:
      - link "CV Generator" [ref=e8] [cursor=pointer]:
        - /url: /
        - generic [ref=e9]:
          - generic [ref=e10]: CV
          - generic [ref=e11]: Generator
      - generic [ref=e12]:
        - button "Home" [ref=e13]
        - button "How to use" [ref=e14]
        - link "Login" [ref=e15] [cursor=pointer]:
          - /url: /login
        - button "Toggle theme" [ref=e16]
  - main [ref=e20]:
    - generic [ref=e22]:
      - generic [ref=e23]:
        - heading "Create Your Professional CV" [level=1] [ref=e24]
        - paragraph [ref=e25]: Complete the following form to create a professional CV
      - generic [ref=e26]:
        - generic [ref=e28]:
          - button "Close Preview" [active] [ref=e30]
          - generic [ref=e32]:
            - heading "Progress" [level=3] [ref=e33]
            - generic [ref=e34]:
              - generic [ref=e35]: 100%
              - button "Lihat detail" [ref=e36]
          - generic [ref=e41]:
            - generic [ref=e42]:
              - generic [ref=e43]: CV Name
              - textbox "CV Name" [ref=e44]:
                - /placeholder: e.g. CV for Google, Frontend 2024
            - generic [ref=e45]:
              - heading "Personal Information" [level=2] [ref=e46]
              - generic [ref=e47]:
                - generic [ref=e48]:
                  - generic [ref=e49]: Full Name *
                  - textbox "Full Name *" [ref=e50]: John Doe Synthetic
                - generic [ref=e51]:
                  - generic [ref=e52]: Email *
                  - textbox "Email *" [ref=e53]:
                    - /placeholder: "eg: example@gmail.com"
                    - text: johndoe.synthetic@example.com
                - generic [ref=e54]:
                  - generic [ref=e55]: Phone Number *
                  - textbox "Phone Number *" [ref=e56]:
                    - /placeholder: "eg: +628123456789"
                    - text: +1-555-0199
                - generic [ref=e57]:
                  - generic [ref=e58]: LinkedIn (optional)
                  - textbox "LinkedIn (optional)" [ref=e59]:
                    - /placeholder: linkedin.com/in/your-name
                    - text: linkedin.com/in/johndoe-synthetic
              - generic [ref=e60]:
                - generic [ref=e61]:
                  - text: Address
                  - generic [ref=e62]: "*"
                  - generic [ref=e63]: "?"
                - textbox "Address * ? Description * ?" [ref=e65]:
                  - /placeholder: "eg: Central Jakarta, Indonesia"
                  - text: 123 Synthetic Avenue, Tech District, Metropolis
              - generic [ref=e66]:
                - generic [ref=e67]: Summary *
                - textbox "Summary *" [ref=e68]:
                  - /placeholder: Summarize your professional identity, notable expertise, and where you're headed in your career (50-100 words)
                  - text: Experienced software developer and technology architect with extensive expertise in scalable web applications, relational data modeling, performance optimization, and distributed cloud computing architecture. Committed to building robust, resilient systems that maintain data integrity and deliver exceptional user experiences across multiple platforms and screen sizes.
                - generic [ref=e69]: "words : 44"
              - generic [ref=e72]:
                - checkbox "Include Profile Photo" [ref=e73]
                - generic [ref=e74]: Include Profile Photo
            - generic [ref=e75]:
              - heading "Work Experience ?" [level=2] [ref=e76]:
                - text: Work Experience
                - generic [ref=e77]: "?"
              - generic [ref=e80]:
                - 'heading "Experience #1" [level=3] [ref=e82]'
                - generic [ref=e83]:
                  - generic [ref=e84]:
                    - generic [ref=e85]: Company *
                    - textbox [ref=e86]: Acme Synthetic Corp
                  - generic [ref=e87]:
                    - generic [ref=e88]: Company Location *
                    - 'textbox "eg: Central Jakarta" [ref=e89]': Metropolis
                  - generic [ref=e90]:
                    - generic [ref=e91]: Position *
                    - 'textbox "eg: Software Engineer" [ref=e92]': Principal Software Engineer
                  - generic [ref=e93]:
                    - generic [ref=e94]: Location Type *
                    - combobox [ref=e95]:
                      - option "Please select"
                      - option "On-site"
                      - option "Hybrid" [selected]
                      - option "Remote"
                  - generic [ref=e96]:
                    - generic [ref=e97]: Start Date *
                    - textbox [ref=e98]
                  - generic [ref=e99]:
                    - generic [ref=e100]: End Date *
                    - textbox [ref=e101]
                  - generic [ref=e102]:
                    - checkbox "I am currently working in this role" [ref=e103]
                    - generic [ref=e104]: I am currently working in this role
                - generic [ref=e105]:
                  - generic [ref=e106]: Description *
                  - textbox "Describe your key responsibilities, achievements, and skills gained in this role (use bullet points for better readability)" [ref=e107]: "- Architected enterprise-grade workflow automation engines handling millions of asynchronous events and processing large volumes of data daily with zero downtime. - Spearheaded enterprise cloud migrations resulting in 45% infrastructure cost savings and a 3x improvement in system resilience and latency. - Mentored junior and mid-level engineering cohorts across global teams on test-driven development, Clean Architecture principles, and domain-driven design. - Designed fault-tolerant message queues and microservice boundaries to isolate failure domains and maintain high availability during peak traffic events. - Re-engineered core database schemas from legacy document structures into highly indexed PostgreSQL relational models with enforced cascading referential integrity."
              - button "Add Work Experience" [ref=e108]
            - generic [ref=e111]:
              - heading "Education ?" [level=2] [ref=e112]:
                - text: Education
                - generic [ref=e113]: "?"
              - generic [ref=e116]:
                - 'heading "Education #1" [level=3] [ref=e118]'
                - generic [ref=e119]:
                  - generic [ref=e120]:
                    - generic [ref=e121]: Institution *
                    - 'textbox "eg: University of Indonesia" [ref=e122]': Institute of Synthetic Technology
                  - generic [ref=e123]:
                    - generic [ref=e124]: Degree
                    - combobox [ref=e125]:
                      - option "Please select" [selected]
                      - option "Doctoral Degree (PhD)"
                      - option "Master's Degree"
                      - option "Bachelor's Degree"
                      - option "Associate Degree"
                      - option "Professional Certification"
                      - option "High School Diploma"
                      - option "Vocational School"
                      - option "Middle School"
                      - option "Elementary School"
                      - option "Other"
                  - generic [ref=e126]:
                    - generic [ref=e127]: Field of Study *
                    - 'textbox "eg: Computer Science" [ref=e128]': Computer Science
                - generic [ref=e129]:
                  - generic [ref=e130]:
                    - generic [ref=e131]: Start Date *
                    - textbox [ref=e132]
                  - generic [ref=e133]:
                    - generic [ref=e134]: End Date (or expected) *
                    - textbox [ref=e135]
                - generic [ref=e136]:
                  - generic [ref=e137]:
                    - text: Description
                    - generic [ref=e138]: "*"
                    - generic [ref=e139]: "?"
                  - textbox "GPA, Academic achievements, Relevant coursework, Honors, Scholarships, etc." [ref=e141]: "- Specialized in advanced distributed algorithms, concurrent operating systems, compiler construction, and database design with honors distinction. - Capstone Project: Built an automated layout calculation and documentation generator utilizing real-time DOM measurements and greedy packing heuristics."
              - button "Add Education" [ref=e142]
            - generic [ref=e145]:
              - heading "Skills ?" [level=2] [ref=e146]:
                - text: Skills
                - generic [ref=e147]: "?"
              - generic [ref=e150]:
                - 'textbox "eg: JavaScript" [ref=e152]': TypeScript / JavaScript (ES6+), React, Node.js
                - button [ref=e153]
              - generic [ref=e156]:
                - 'textbox "eg: JavaScript" [ref=e158]': PHP, Laravel, Eloquent ORM, PHPUnit, Architecture
                - button [ref=e159]
              - generic [ref=e162]:
                - 'textbox "eg: JavaScript" [ref=e164]': PostgreSQL, SQLite, Docker, Playwright, Tailwind CSS
                - button [ref=e165]
              - button "Add Skill" [ref=e168]
            - generic [ref=e171]:
              - heading "Add-ons ?" [level=2] [ref=e172]:
                - text: Add-ons
                - generic [ref=e173]: "?"
              - generic [ref=e176]:
                - generic [ref=e177]:
                  - checkbox "Portfolio" [checked] [ref=e178]
                  - generic [ref=e179]: Portfolio
                - generic [ref=e180]:
                  - checkbox "Licenses & Certifications" [checked] [ref=e181]
                  - generic [ref=e182]: Licenses & Certifications
                - generic [ref=e183]:
                  - checkbox "Accomplishments" [checked] [ref=e184]
                  - generic [ref=e185]: Accomplishments
                - generic [ref=e186]:
                  - checkbox "Organizations" [checked] [ref=e187]
                  - generic [ref=e188]: Organizations
                - generic [ref=e189]:
                  - checkbox "Languages" [checked] [ref=e190]
                  - generic [ref=e191]: Languages
                - generic [ref=e192]:
                  - checkbox "Additional Information" [checked] [ref=e193]
                  - generic [ref=e194]: Additional Information
            - generic [ref=e195]:
              - heading "Portfolio ?" [level=2] [ref=e196]:
                - text: Portfolio
                - generic [ref=e197]: "?"
              - generic [ref=e200]:
                - 'heading "Portfolio Item #1" [level=3] [ref=e202]'
                - generic [ref=e203]:
                  - generic [ref=e204]:
                    - generic [ref=e205]: Project Title *
                    - 'textbox "eg: E-commerce app" [ref=e206]': Document Pagination & PDF Layout Engine
                  - generic [ref=e207]:
                    - generic [ref=e208]: Link
                    - 'textbox "eg: example.com" [ref=e209]': https://example.com/portfolio/pdf-engine
                - generic [ref=e210]:
                  - generic [ref=e211]: Description *
                  - textbox "Describe the project, your role, technologies used, and key accomplishments" [ref=e212]: Developed a high-performance frontend engine that computes deterministic page breaks and renders canonical A4 print layouts directly inside browser runtimes.
              - button "Add Portfolio Item" [ref=e213]
            - generic [ref=e216]:
              - heading "Licenses & Certifications" [level=2] [ref=e217]
              - generic [ref=e218]:
                - 'heading "License / Certification #1" [level=3] [ref=e220]'
                - generic [ref=e221]:
                  - generic [ref=e222]:
                    - generic [ref=e223]: Name *
                    - textbox "e.g. AWS Certified Solutions Architect" [ref=e224]: Certified Senior Solution Architect
                  - generic [ref=e225]:
                    - generic [ref=e226]: Issuing Organization *
                    - textbox "e.g. Amazon Web Services" [ref=e227]: Cloud Native Architecture Academy
                - generic [ref=e228]:
                  - generic [ref=e229]:
                    - generic [ref=e230]: Issue Date *
                    - textbox [ref=e231]
                  - generic [ref=e232]:
                    - generic [ref=e233]: Expiration Date
                    - textbox [ref=e234]
                - generic [ref=e235]:
                  - checkbox "This certification has an expiration date" [checked] [ref=e236]
                  - generic [ref=e237]: This certification has an expiration date
                - generic [ref=e238]:
                  - generic [ref=e239]: Credential ID
                  - textbox "e.g. AWS-1234567890" [ref=e240]: CERT-8899-ARCH-2023
              - button "Add License / Certification" [ref=e241]
            - generic [ref=e244]:
              - heading "Accomplishments ?" [level=2] [ref=e245]:
                - text: Accomplishments
                - generic [ref=e246]: "?"
              - generic [ref=e249]:
                - 'heading "Accomplishment #1" [level=3] [ref=e251]'
                - generic [ref=e252]:
                  - generic [ref=e253]: Description *
                  - 'textbox "eg: Received Employee of the Month award for increasing team productivity by 25%" [ref=e254]': Awarded Outstanding Engineering Contribution Award in 2024 for resolving critical production latency bottlenecks and standardizing core automated E2E testing pipelines across eighteen disparate microservice repositories.
              - button "Add Accomplishment" [ref=e255]
            - generic [ref=e258]:
              - heading "Organizations ?" [level=2] [ref=e259]:
                - text: Organizations
                - generic [ref=e260]: "?"
              - generic [ref=e263]:
                - 'heading "Organization #1" [level=3] [ref=e265]'
                - generic [ref=e266]:
                  - generic [ref=e267]:
                    - generic [ref=e268]: Organization Name *
                    - 'textbox "eg: IEEE" [ref=e269]': Open Source Developers Guild
                  - generic [ref=e270]:
                    - generic [ref=e271]: Position *
                    - 'textbox "eg: Member" [ref=e272]': Technical Committee Member & Reviewer
                - generic [ref=e273]:
                  - generic [ref=e274]:
                    - generic [ref=e275]: Start Date *
                    - textbox [ref=e276]
                  - generic [ref=e277]:
                    - generic [ref=e278]: End Date
                    - textbox [disabled] [ref=e279]
                - generic [ref=e280]:
                  - checkbox "I am currently active in this organization" [checked] [ref=e281]
                  - generic [ref=e282]: I am currently active in this organization
                - generic [ref=e283]:
                  - generic [ref=e284]: Description *
                  - textbox "Describe your role, responsibilities, and accomplishments in this organization" [ref=e285]: Collaborated with open-source contributors to establish rigorous code review standards, documentation conventions, and automated integration pipelines for community tooling.
              - button "Add Organization" [ref=e286]
            - generic [ref=e289]:
              - heading "Languages" [level=2] [ref=e290]
              - generic [ref=e291]:
                - 'textbox "eg: English" [ref=e293]': English
                - combobox [ref=e295]:
                  - option "Please select" [selected]
                  - option "Native or bilingual proficiency"
                  - option "Full professional proficiency"
                  - option "Professional working proficiency"
                  - option "Limited working proficiency"
                  - option "Elementary proficiency"
              - button "Add Language" [ref=e296]
            - generic [ref=e299]:
              - heading "Additional Information" [level=2] [ref=e300]
              - textbox "Include any other information you'd like to share, such as hobbies, volunteer work, or personal interests relevant to your application" [ref=e302]: Available for technical architecture consulting, system design audits, and code optimizations. Enthusiast of clean design systems, typography, and reactive user interfaces.
            - generic [ref=e303]:
              - button "Generate PDF" [ref=e304]
              - button "Close Preview" [ref=e305]
        - generic [ref=e307]:
          - generic [ref=e308]:
            - heading "Preview CV" [level=2] [ref=e309]
            - button [ref=e311]
          - generic [ref=e316]:
            - generic [ref=e317]:
              - generic [ref=e318]: 25%
              - slider "Zoom" [ref=e319]: "100"
              - generic [ref=e320]: 200%
              - generic [ref=e321]: 100%
              - button "Hide Zoom Control" [ref=e322]
            - generic [ref=e325]:
              - generic [ref=e327]:
                - generic [ref=e328]:
                  - generic [ref=e331]:
                    - heading "John Doe Synthetic" [level=1] [ref=e332]
                    - generic [ref=e334]:
                      - paragraph [ref=e335]:
                        - link "+1-555-0199" [ref=e336] [cursor=pointer]:
                          - /url: https://wa.me/6215550199
                      - generic [ref=e337]: "|"
                      - paragraph [ref=e338]: johndoe.synthetic@example.com
                      - generic [ref=e339]: "|"
                      - paragraph [ref=e340]: linkedin.com/in/johndoe-synthetic
                      - generic [ref=e341]: "|"
                      - paragraph [ref=e342]: 123 Synthetic Avenue, Tech District, Metropolis
                  - generic [ref=e343]:
                    - heading "Summary" [level=2] [ref=e344]
                    - paragraph [ref=e345]: Experienced software developer and technology architect with extensive expertise in scalable web applications, relational data modeling, performance optimization, and distributed cloud computing architecture. Committed to building robust, resilient systems that maintain data integrity and deliver exceptional user experiences across multiple platforms and screen sizes.
                  - heading "Work Experience" [level=2] [ref=e347]
                  - generic [ref=e348]:
                    - generic [ref=e349]:
                      - heading "Principal Software Engineer" [level=3] [ref=e350]
                      - generic [ref=e351]: Jan 2020 - Dec 2025 (5y 11m)
                    - heading "Acme Synthetic Corp, Metropolis (Hybrid)" [level=4] [ref=e352]
                  - generic [ref=e353]:
                    - generic [ref=e354]: •
                    - generic [ref=e355]: Architected enterprise-grade workflow automation engines handling millions of asynchronous events and processing large volumes of data daily with zero downtime.
                  - generic [ref=e356]:
                    - generic [ref=e357]: •
                    - generic [ref=e358]: Spearheaded enterprise cloud migrations resulting in 45% infrastructure cost savings and a 3x improvement in system resilience and latency.
                  - generic [ref=e359]:
                    - generic [ref=e360]: •
                    - generic [ref=e361]: Mentored junior and mid-level engineering cohorts across global teams on test-driven development, Clean Architecture principles, and domain-driven design.
                  - generic [ref=e362]:
                    - generic [ref=e363]: •
                    - generic [ref=e364]: Designed fault-tolerant message queues and microservice boundaries to isolate failure domains and maintain high availability during peak traffic events.
                  - generic [ref=e365]:
                    - generic [ref=e366]: •
                    - generic [ref=e367]: Re-engineered core database schemas from legacy document structures into highly indexed PostgreSQL relational models with enforced cascading referential integrity.
                  - heading "Education" [level=2] [ref=e369]
                  - generic [ref=e370]:
                    - generic [ref=e371]:
                      - heading "Bachelor of Science , Computer Science" [level=3] [ref=e372]
                      - generic [ref=e373]: Aug 2015 - May 2019
                    - heading "Institute of Synthetic Technology" [level=4] [ref=e374]
                  - generic [ref=e375]:
                    - generic [ref=e376]: •
                    - generic [ref=e377]: Specialized in advanced distributed algorithms, concurrent operating systems, compiler construction, and database design with honors distinction.
                  - generic [ref=e378]:
                    - generic [ref=e379]: •
                    - generic [ref=e380]: "Capstone Project: Built an automated layout calculation and documentation generator utilizing real-time DOM measurements and greedy packing heuristics."
                  - heading "Skills" [level=2] [ref=e382]
                  - generic [ref=e384]:
                    - generic [ref=e385]: • TypeScript / JavaScript (ES6+), React, Node.js
                    - generic [ref=e387]: • PHP, Laravel, Eloquent ORM, PHPUnit, Architecture
                    - generic [ref=e389]: • PostgreSQL, SQLite, Docker, Playwright, Tailwind CSS
                - generic [ref=e391]: Page 1 of 2
              - generic [ref=e393]:
                - generic [ref=e394]:
                  - heading "Portfolios" [level=2] [ref=e396]
                  - heading [level=3] [ref=e399]:
                    - text: Document Pagination & PDF Layout Engine (
                    - link "https://example.com/portfolio/pdf-engine" [ref=e400] [cursor=pointer]:
                      - /url: https://example.com/portfolio/pdf-engine
                    - text: )
                  - paragraph [ref=e401]: Developed a high-performance frontend engine that computes deterministic page breaks and renders canonical A4 print layouts directly inside browser runtimes.
                  - heading "Accomplishments" [level=2] [ref=e403]
                  - paragraph [ref=e404]: Awarded Outstanding Engineering Contribution Award in 2024 for resolving critical production latency bottlenecks and standardizing core automated E2E testing pipelines across eighteen disparate microservice repositories.
                  - heading "Organization" [level=2] [ref=e406]
                  - generic [ref=e408]:
                    - heading "Technical Committee Member & Reviewer, Open Source Developers Guild" [level=3] [ref=e409]
                    - generic [ref=e410]: Mar 2021 - Dec 2025
                  - paragraph [ref=e411]: Collaborated with open-source contributors to establish rigorous code review standards, documentation conventions, and automated integration pipelines for community tooling.
                  - heading "Languages" [level=2] [ref=e413]
                  - list
                  - listitem [ref=e414]:
                    - text: English
                    - generic [ref=e415]: (Native / Bilingual)
                  - heading "Additional Info" [level=2] [ref=e417]
                  - paragraph [ref=e418]: Available for technical architecture consulting, system design audits, and code optimizations. Enthusiast of clean design systems, typography, and reactive user interfaces.
                - generic [ref=e419]: Page 2 of 2
  - contentinfo [ref=e420]:
    - generic [ref=e422]:
      - generic [ref=e423]: © 2026 Fauzan Dzikry. All rights reserved.
      - generic [ref=e424]:
        - link "LinkedIn" [ref=e425] [cursor=pointer]:
          - /url: https://www.linkedin.com/in/fauzan-dzikry/
        - link "GitHub" [ref=e429] [cursor=pointer]:
          - /url: https://github.com/FauzanDzikry
        - link "Instagram" [ref=e433] [cursor=pointer]:
          - /url: https://www.instagram.com/fauzandzzz/
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'node:fs';
  3  | import path from 'node:path';
  4  | 
  5  | const fixtureData = JSON.parse(
  6  |     fs.readFileSync(
  7  |         path.resolve(process.cwd(), 'tests/e2e/fixtures/cv-pagination-long.json'),
  8  |         'utf-8',
  9  |     ),
  10 | );
  11 | 
  12 | test.describe('CV Preview & Pagination Regression', () => {
  13 |     test('preview is visible beside form and paginates deterministically without early breaks', async ({ page }) => {
  14 |         // Inject localStorage data before navigating
  15 |         await page.addInitScript((data) => {
  16 |             window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
  17 |             window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
  18 |         }, fixtureData);
  19 | 
  20 |         await page.goto('/generate-cv');
  21 | 
  22 |         // Click the Preview CV button to reveal the preview pane
  23 |         const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
  24 |         await previewButton.click();
  25 | 
  26 |         // Verify page loads without selector, timeout, or server errors
  27 |         const previewHeader = page.locator('h2', { hasText: 'Preview CV' });
  28 |         await expect(previewHeader).toBeVisible();
  29 | 
  30 |         const cvPages = page.locator('.cv-page');
  31 |         await expect(cvPages.first()).toBeVisible();
  32 |         
  33 |         const pageCount = await cvPages.count();
  34 |         expect(pageCount).toBeGreaterThanOrEqual(1);
  35 | 
  36 |         // Mark test as regression expected to fail until Phase 4 (sticky layout) & Phase 5 (pagination engine)
  37 |         test.fail(true, 'Regression: expected to fail until Phase 4 (sticky preview) and Phase 5 (measured semantic blocks) are implemented');
  38 | 
  39 |         // Phase 4 Contract: Preview wrapper must be sticky with position: sticky
  40 |         const previewSection = previewHeader.locator('..').locator('..').locator('..');
  41 |         const position = await previewSection.evaluate((el) => window.getComputedStyle(el).position);
> 42 |         expect(position).toBe('sticky');
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  43 |     });
  44 | });
  45 | 
```