export const DEFAULT_LANG = 'en_US'

const dict = {
  // actions/captcha.ts
  'Site key': 0,
  'Secret key': 1,
  'Captcha provider': 2,
  "Protects Keila's signup forms and password-reset page from bots. Without your own keys Keila uses hCaptcha's public test keys, which load hCaptcha but stop no bots.": 3,
  'None (hCaptcha test keys)': 4,
  'Configure Captcha': 5,
  'Enter hCaptcha or Friendly Captcha keys so signup forms and password resets are protected from bots. Keila restarts to apply the change.': 6,
  Settings: 7,
  // actions/exportContacts.ts
  Project: 8,
  'The Keila project to export, by name. Leave empty if you have only one project.': 9,
  'Export Contacts': 10,
  "Save every contact in a Keila project as a CSV file in the ${folder} folder of your file service. The file has the same columns as Keila's own export, so it can be imported again.": 11,
  Contacts: 12,
  'store.json not found': 13,
  "Nextcloud lists files added this way only after its file cache is updated: run Nextcloud's Scan Files action to see it.": 14,
  'Contacts Exported': 15,
  'Saved ${count} contacts from ${project} to ${file} in ${location}.': 16,
  // actions/fileStorage.ts
  'File service': 17,
  "Where Keila keeps its ${folder} folder for contact imports and exports. NextExplorer is recommended: its ${folder} location also shows up in Nextcloud through Nextcloud's External Storage action.": 18,
  None: 19,
  'Nextcloud username': 20,
  'The login name of the Nextcloud user whose files hold the ${folder} folder.': 21,
  'Letters, digits and the characters _ . @ - only': 22,
  'File Storage': 23,
  'Choose the file service (NextExplorer, FileBrowser Quantum or Nextcloud) that holds the ${folder} folder used by Import Contacts and Export Contacts. Keila reads and writes only inside that folder.': 24,
  // actions/importContacts.ts
  'CSV file': 25,
  "Name of the CSV file in the ${folder} folder, for example subscribers.csv. Columns: Email, First name, Last name (the names may be empty). A file from Export Contacts or from Keila's own export works as-is.": 26,
  'A file name ending in .csv, without folders': 27,
  'The Keila project to import into, by name. Leave empty if you have only one project.': 28,
  'Existing contacts': 29,
  'What to do when an email address in the file is already a contact in the project.': 30,
  'Update them with the names in the file': 31,
  'Leave them unchanged': 32,
  'Import Contacts': 33,
  'Add the contacts in a CSV file from your file service to a Keila project. Put the file in the ${folder} folder first.': 34,
  'There is no ${file} in ${location}.': 35,
  'Contacts Imported': 36,
  'Imported ${file} into ${project}: ${count} new contacts. The project now has ${total} contacts.': 37,
  // actions/manageSmtp.ts
  'Configure System Email': 38,
  "The mail server Keila uses for its own emails: password resets and new-account emails. Newsletters do not use it; each Keila project sends through the sender you set up in Keila's Senders page. Keila restarts to apply the change.": 39,
  // actions/setAdminPassword.ts
  'Set Admin Password': 40,
  "Generate a new random password for Keila's admin account. If Keila is running it restarts, and the new password is applied before it starts again.": 41,
  'This replaces the current admin password, and the old one stops working.': 42,
  'Keila Admin Credentials': 43,
  'Sign in to Keila with these credentials. If you changed the account email inside Keila, sign in with that email instead.': 44,
  Email: 45,
  Password: 46,
  // actions/toggleRegistration.ts
  'Disable Public Signups': 47,
  'Enable Public Signups': 48,
  'Anyone who can reach Keila can currently create an account. Turn this off once everyone who needs an account has one. Keila restarts to apply the change.': 49,
  'Let anyone who can reach Keila create their own account. Off by default: as the admin you can add accounts from the Users page in Keila instead. Keila restarts to apply the change.': 50,
  'With a public address, anyone on the internet can create an account and send email through your senders.': 51,
  // dependencies.ts
  'Holds the Keila folder for contact imports and exports': 52,
  // init/primaryUrlTask.ts
  'Choose the public address Keila uses in every email link. Keila does not run until one is chosen.': 53,
  // init/watchCredentials.ts
  'Create the admin password before starting Keila': 54,
  // interfaces.ts
  'Web UI': 55,
  'Keila admin interface, plus the public signup forms, unsubscribe pages and images your subscribers open': 56,
  // main.ts
  'Starting Keila!': 57,
  'Run the Set Admin Password action before starting Keila.': 58,
  'Keila cannot start without a public address. Run the Set Public Address action, then start the service.': 59,
  Database: 60,
  'PostgreSQL is ready': 61,
  'Waiting for PostgreSQL to be ready': 62,
  'Web Interface': 63,
  'The web interface is ready': 64,
  'The web interface is not ready': 65,
  'Public Address': 66,
  'Links in your emails use ${url}': 67,
  'Links in your emails use ${url}, which subscribers cannot open. Set up a public domain (StartTunnel or port forwarding), then choose it with the Set Public Address action.': 68,
  'System Email': 69,
  'Account and password-reset emails are sent from ${from}': 70,
  'Keila cannot send account or password-reset emails. Use the Configure System Email action to enable them. Campaigns are unaffected; they use the senders you set up in each project.': 71,
  // primaryUrl.ts
  'Set Public Address': 72,
  'Choose the address Keila puts in every link it sends: unsubscribe and confirmation links, signup forms, tracking links and images. Subscribers must be able to open it from the internet, so pick a public domain. Keila restarts to apply the change.': 73,
  'Public address': 74,
  'Only a public domain (set up with StartTunnel or port forwarding) works for subscribers. A .local, IP or .onion address works only for you.': 75,
  // utils.ts
  'Internal secrets are missing from store.json': 76,
  'the ${folder} location in NextExplorer': 77,
  'the ${folder} folder in FileBrowser Quantum': 78,
  "the ${folder} folder in ${user}'s Nextcloud files": 79,
  'No file service is selected. Run the File Storage action to choose NextExplorer, FileBrowser Quantum or Nextcloud.': 80,
  '${service} is not installed. Install it, or choose another service with the File Storage action.': 81,
  'Run the File Storage action and enter your Nextcloud username.': 82,
  'Nextcloud has no files for a user named ${user}. Check the username in the File Storage action; it is the login name, not the display name.': 83,
  'Keila did not report a result. Check the service logs.': 84,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
