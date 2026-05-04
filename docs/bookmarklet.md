# Quick Add Bookmarklet

Log a job from any job board in two clicks without switching tabs manually.

## Install (one time)

1. Open the app and log in
2. Make sure your bookmarks bar is visible (`Cmd+Shift+B` on Mac, `Ctrl+Shift+B` on Windows)
3. Find **⚡ Log This Job** in the top nav bar
4. Drag it to your bookmarks bar

Done. You only do this once.

## Use

1. Find a job posting you want to log
2. Click **⚡ Log This Job** in your bookmarks bar
3. Your app opens with the Add Application modal pre-filled
4. Confirm or adjust the details and hit **Add Application**

## What gets auto-filled

| Field   | How it's filled                                         |
| ------- | ------------------------------------------------------- |
| URL     | The full page URL of the job posting                    |
| Company | Extracted from the URL path or page title (see below)   |
| Role    | Extracted from the page title                           |

## Site support

| Site        | Company | Role | Notes                                      |
| ----------- | ------- | ---- | ------------------------------------------ |
| Lever       | Yes     | Yes  | Company from URL path — reliable           |
| Greenhouse  | Yes     | Yes  | Company from URL path — reliable           |
| Workable    | Yes     | Yes  | Company from URL path — reliable           |
| Workday     | Yes     | Yes  | Company from subdomain — reliable          |
| LinkedIn    | Partial | Yes  | Role from page title. Company works on individual job pages with format "Role at Company" in the title. Search/feed pages won't work. |
| Other sites | Partial | Yes  | Falls back to page title parsing and hostname |

## Clipboard detection

When you open the Add Application modal manually (via the + button), the app
checks your clipboard. If you've copied a job URL, it auto-fills the URL field
and parses the company from it. No bookmarklet needed for this flow.

## Troubleshooting

**Nothing happens when I click the bookmark**
The bookmark was saved before a fix was applied. Re-drag the button from the nav.

**Company shows a wrong name**
The site uses an unusual URL structure. Edit the company field manually — it is
always editable after auto-fill.

**Role is blank or wrong**
The page title did not follow a recognizable pattern. Fill it in manually.
