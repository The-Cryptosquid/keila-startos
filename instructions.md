# Keila

> **Keila needs a public domain.** Every email Keila sends is full of links — unsubscribe and confirmation links, signup forms, tracking links and images — and your subscribers open them from wherever they are, over the internet. If Keila is reachable only on your home network, over VPN or over Tor, your newsletters arrive with links nobody can open. Set up a public domain **before** you send your first campaign; [Your public domain](#your-public-domain) below explains how.

## Documentation

- [Keila documentation](https://www.keila.io/docs/*) — the upstream guide to projects, contacts, forms, campaigns and senders.

## What you get on StartOS

- **Web UI** — one interface for everything: the Keila admin app where you write campaigns and manage contacts, and the public pages your subscribers reach from your emails (signup forms, unsubscribe and confirmation pages, uploaded images).
- A private PostgreSQL database for Keila, included in your StartOS backups together with your uploaded images.
- An admin account created for you, with the password managed by the **Set Admin Password** action. Public signups are **off**: only you, and the accounts you add, can sign in.
- Contact import and export through a folder in **NextExplorer**, **FileBrowser Quantum** or **Nextcloud**.

## Your public domain

StartOS can make a service reachable from outside your home in three ways. Start9 explains each in [Remote Access](https://docs.start9.com/start-os/0.4.2.x/remote-access.html):

- **VPN** — your own devices join your home network from anywhere. Fine for you to manage Keila while travelling; useless to subscribers, who are not on your VPN.
- **Tor** — a `.onion` address. Works for you in Tor Browser; most subscribers' email apps and browsers cannot open it.
- **Clearnet** — a normal public domain such as `news.example.com`. **This is the one Keila needs**, because it is the only one every subscriber can open.

To give Keila a clearnet domain you need a domain name you control and a **gateway** that lets the internet reach your server. There are two kinds:

1. **StartTunnel (recommended)** — a small virtual private router you rent (a VPS) that forwards traffic to your server. It works even if your internet provider uses CGNAT, it has a stable IP, and it shows subscribers the VPS's location instead of your home's. See [StartTunnel](https://docs.start9.com/start-tunnel/).
2. **Port forwarding on your home router** — free, but it reveals your home's approximate location to anyone who connects, your home IP can change (use dynamic DNS), and it does not work at all if your provider uses CGNAT.

Then, following Start9's [Clearnet](https://docs.start9.com/start-os/0.4.2.x/clearnet.html) guide:

1. Set up the gateway — see [Gateways](https://docs.start9.com/start-os/0.4.2.x/gateways.html).
2. On Keila's **Web UI** interface page, find that gateway, click **Add Domain** and choose **Public Domain**. Enter the domain, for example `news.example.com`.
3. Create the DNS record and the port forwarding the guide lists.
4. Run Keila's **Set Public Address** action and choose your new `https://` domain.

[Public Access](https://docs.start9.com/start-os/0.4.2.x/public-access.html) covers the same choices in more depth. Keila's **Public Address** status on the service page turns green once the chosen address is a public domain; until then it tells you which address your emails are using.

**Keeping your home IP private.** If you use StartTunnel to keep your home IP private, also send Keila's outbound traffic through that tunnel. Keila delivers every email by connecting to your mail provider (your SMTP server, Amazon SES, Mailgun, Postmark or Sendgrid). That provider sees the address Keila connects from, and many providers write it into the headers of every email your subscribers receive. If you use the tunnel for another reason, such as a port your router cannot forward, there is nothing to change.

## Getting set up

1. Run the **Set Admin Password** task. Copy the email and password it shows; you sign in to Keila with them.
2. Run the **Set Public Address** task. Choose your public domain. If you have not set one up yet, you can pick your `.local` address for now to look around, but come back and switch before you send anything (see [Your public domain](#your-public-domain)).
3. Start Keila. The first start prepares the database and can take a few minutes.
4. Open the **Web UI** and sign in.
5. In Keila, create a **project** (one per newsletter), then add a **sender** under the project's **Senders** page. The sender is how campaigns are delivered: your own SMTP server, or Amazon SES, Mailgun, Postmark or Sendgrid. See the [Keila documentation](https://www.keila.io/docs/senders) for each type.
6. Optional but recommended: run **Configure System Email** so Keila can send password-reset emails, and **File Storage** if you want to import or export contacts as files.

## Using Keila

### Web UI

After signing in you see your projects. Inside a project you manage **Contacts** and **Segments**, build **Forms** (signup forms you link to or embed on your website), set up **Senders**, and write and schedule **Campaigns**. Subscribers who use your forms or the links in your emails reach the same interface at your public address, where they see only the public pages.

To give someone else an account without opening public signups, add it on Keila's **Users** page (in the admin menu).

### Actions

- **Set Admin Password** — creates a new random password for the admin account and shows it with the account email. Keila restarts if it is running, and the old password stops working. If you changed the account's email inside Keila, sign in with that email.
- **Set Public Address** — chooses the address Keila builds every link from. Pick your public domain. Changing it restarts Keila. Emails you already sent keep their old links, so change it before you send campaigns, not after.
- **Configure System Email** (Settings) — the mail server Keila uses for its own emails: password resets and new-account emails. Choose **System Credentials** to use the email server configured for your whole StartOS server, or enter a provider of your own. Your newsletters do **not** use this; they go through each project's sender.
- **Enable Public Signups / Disable Public Signups** (Settings) — lets anyone who can reach Keila create an account. Off by default; with a public domain, turning it on lets anyone on the internet send email through your senders.
- **Configure Captcha** (Settings) — enter hCaptcha or Friendly Captcha keys to protect your signup forms and the password-reset page from bots. Without keys, Keila shows hCaptcha's test widget, which stops nothing.
- **File Storage** (Contacts) — chooses where Keila keeps its `Keila` folder: **NextExplorer** (a location named `Keila`), **FileBrowser Quantum** (a folder named `Keila`) or **Nextcloud** (a folder named `Keila` in the files of the Nextcloud user you name). Install the service you choose first. Keila reads and writes only inside that folder.
- **Import Contacts** (Contacts) — put a CSV file in the `Keila` folder, then run this with the file name. The file needs the columns `Email`, `First name` and `Last name` (names can be empty); a file from **Export Contacts** or from Keila's own export works as it is. If you have more than one project, enter the project's name. Choose whether contacts already in the project are updated or left alone.
- **Export Contacts** (Contacts) — saves all contacts of a project to a new CSV file in the `Keila` folder, named after the project and the date.

### Using the Keila folder with Nextcloud

NextExplorer is the easiest choice if you also use Nextcloud. Choose NextExplorer in Nextcloud's **External Storage** action, and NextExplorer's locations, including `Keila`, appear as folders in Nextcloud. New exports then show up there on their own. Nextcloud looks for new locations when it starts, so restart it once after Keila's first import or export creates the `Keila` location. If you choose Nextcloud directly in **File Storage** instead, Nextcloud lists a new export only after you run its **Scan Files** action.

## Limitations

- **Contacts only, not images.** The file services hold contact CSV files. Images you upload into campaigns stay in Keila, which serves them to your subscribers.
