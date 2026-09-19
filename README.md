# Lesson Plans

A Docsify site with reusable scripture-study lessons organized by course and curriculum week.

## Preview

Requires Node.js 22.12 or later and npm.

```sh
npm install
npm run docs:serve
```

Starting the preview rebuilds navigation and the presentation automatically. The site is served at http://localhost:3000.

## Presentations

This week's sidebar includes **Presentation - Come Now**, an eighteen-slide [Slidev](https://sli.dev) deck with two alternative 25-minute paths: Isaiah 1:16-18 (slides 1-10), or Isaiah 6 with an Isaiah 12 reflection (slides 11-15). Slides 16-18 offer optional studies of Isaiah 2, 3-4, and 11. Choose one path rather than trying to cover everything. The student-facing presentation page links directly to these sections; timing and discussion guidance remain in Slidev's presenter notes.

Edit [presentations/isaiah-1-12/slides.md](presentations/isaiah-1-12/slides.md) and preview changes live:

```sh
npm run slides:dev
```

Slidev runs at http://localhost:3030. Use its presenter view to open a separate audience window. Notes are part of the published deck, not confidential storage.

```sh
npm run slides:build
```

This produces the static presentation under `docs/presentations/isaiah-1-12/`. The full `npm run docs:build` command rebuilds both navigation and slides. Relative asset paths and hash routing support both root hosting and GitHub Pages repository subpaths without server rewrites.

Keep the generated presentation with the other generated docs when publishing this static site. Rebuild after source changes; do not hand-edit the compiled assets. The build clears only this deck's output directory, so put source material in `presentations/`, not in its generated directory under `docs/`.

The snow photograph is bundled locally from [Unsplash](https://images.unsplash.com/photo-1454496522488-7a8e488e8606), and the deck uses local system fonts. After building, the slides need no external image or font services. Slidev 51.8.2 is pinned because the configured package registry quarantines a dependency in version 53; do not bypass registry restrictions when upgrading.

Run `npm run test:slides` for desktop/mobile browser checks. Install the test browser once with `npx playwright install chromium`, or use an installed Chrome with `PLAYWRIGHT_CHANNEL=chrome npm run test:slides`. The check starts its own preview on port 3002, verifies all eighteen slides and their launch links, and saves screenshots in the ignored `test-results/` folder. `npm test` remains the fast navigation and scripture-formatting check.

## Select This Week

Change `currentLesson` in [lessons.json](lessons.json) to the folder path of a prepared lesson:

```json
"currentLesson": "old-testament/37-proverbs-ecclesiastes"
```

Then run:

```sh
npm run docs:build
```

Refresh the site if the preview is already running. Selection is manual, so holidays and changes to your teaching schedule do not move the lesson unexpectedly.

The selected lesson's pages appear in the This Week section. The course archive lists every prepared lesson in ascending week order, with its pages nested beneath its overview link. Use the arrow beside a lesson to expand or collapse its pages; the overview link opens the lesson itself. Lessons with no topic pages remain simple overview links.

Search indexes all catalog pages, including archived lessons that are not expanded in the sidebar.

## Add a Lesson

1. Create a folder under `docs/<course>/<two-digit-week>-<topic>/`. The current lessons use [docs/old-testament/36-psalms-100-150/README.md](docs/old-testament/36-psalms-100-150/README.md) and [docs/old-testament/37-proverbs-ecclesiastes/README.md](docs/old-testament/37-proverbs-ecclesiastes/README.md).
2. Add an overview named `README.md` and the lesson's Markdown pages. List the pages in the overview so the lesson remains navigable when it is archived.
3. Add an entry to the matching course in [lessons.json](lessons.json), with `week`, `slug`, `subject`, `title`, and an ordered `pages` list of `file` and `title` pairs. The folder name is derived from the week and slug; page files are relative to that folder.
4. Update `currentLesson` if this is the lesson you are teaching now.
5. Run `npm run docs:build` and `npm test`.

Add courses such as `new-testament`, `book-of-mormon`, or `doctrine-and-covenants` as needed. Courses with no lessons do not appear in navigation.

Use links relative to the site root, matching the existing Docsify convention. For example, a page in week 37 links to its overview as `old-testament/37-proverbs-ecclesiastes/README.md`, not just `README.md`.

Keep calendar dates in lesson content, not folder names. Week numbers organize the course; check the assignments when a new four-year cycle begins rather than assuming that its schedule is identical.

## Scripture Quotes

Start each quoted scripture verse with its actual verse number, using `> 4. Verse text`. Keep the scripture citation or source link nearby. Number excerpts too, but do not number discussion prompts, speaker commentary, or unversified text such as the Book of Mormon title page.

Consecutive verses can use consecutive quote rows. Between nonconsecutive verses, insert **two empty `>` rows** so Docsify starts a new numbered list instead of displaying the next sequential number. Also separate verses from different chapters this way. Split excerpts that combine multiple verses into individually numbered entries.

```markdown
> 1. A soft answer turneth away wrath: but grievous words stir up anger. (15:1)
>
>
> 4. A wholesome tongue is a tree of life: but perverseness therein is a breach in the spirit. (15:4)
```

Run `npm test` to check directly cited verse numbers and skipped-verse spacing along with navigation.

## Generated Navigation

[docs/README.md](docs/README.md), [docs/_sidebar.md](docs/_sidebar.md), and [docs/lesson-routes.js](docs/lesson-routes.js) are generated by [scripts/build-navigation.mjs](scripts/build-navigation.mjs). Edit the catalog instead of these generated files.

Keep the generated files with the lesson changes when publishing. The deployed site remains static and does not require Node.js or a build service to run.

The existing `#/psalms/...` and `#/proverbs-ecclesiastes/...` site URLs still work through Docsify aliases. The optional `legacyPath` field records these old routes. These aliases preserve site navigation, not direct HTTP requests for the old raw Markdown files.

The build checks that every catalog page exists before replacing navigation. It does not rewrite lesson content or overview page lists.