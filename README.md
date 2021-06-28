# dot-handy

Just a handy utility to make your life testing dotcom things easier. 

As dotcom developers, we often need to configure our browser instance in certain ways and perform repetitive actions upon a task, so this utility aims to ease the burden 
by:

1. Let you put the browser configuration you need to apply for what you are working on into a configuration file, so you don't need to tweak them again and again. 
Say goodbye to messing up with your browsers for daily uses. 
1. Manage your own browser automation scripts for repetitive tasks in a way that's less involving than a formal e2e test.

dot-handy uses Playwright internally to implement the above two concepts as **configuration** and **actions**.

Configuration here simply means browser configuration you want to use to initiatialize your browser instance. e.g. browser type, locale, cookies, and local storage. 
Except for general browser settings, there are also dotcom-specific properties available like `--currency`. Configuration can be supplied
through either a JSON configuration file or commandline options. A configuration file is first looked up from `local-configs` directory and then `configs` directory.
The coresponding properties supplied by the commandline options will override. `-C` or `--config-files` options are used to supply config files; the corresponding commandline options for the properties are a bit ad hoc. For the most up-to-date list of properties and their commandline options, [referring to the source code](https://github.com/Automattic/dot-handy/blob/trunk/main.js#L47) will be the best.

Actions here refers to browser automation scripts that will be run after initiating. Currently they can only be supplied by `-A` or `--action-files` commandline option.
e.g. `yarn start -A new-user,pick-free-domain,pick-free-plan` means to open a new browser instance and then to create a new user, pick a free domain, 
and then choose the Free plan. It's kind of limiting right now because we can't use them in-between our own manual testing. An action file is looked up in a similar manner
like configuration files: `local-actions` will be looked up first, and then `actions` directory. Actions can require certain configuration properties to work, 
like the action for setting ExPlat variations.

# Getting started
If you have `yarn` installed already, running `yarn install` should be all that you need to start playing it.

# Sample Use Cases

#### 1. Start a browser instance of chromium, webkit, or firefox
```
> yarn start                 # default to chromium
> yarn start -B webkit
> yarn start -B firefox
```
#### 2. Open the local calypso
```
> yarn start -E local
```
#### 3. Set locale
```
> yarn start --locale "zh-TW"
```
#### 4. Set currency
```
> yarn start --currency "PHP"
```

#### 5. Login as a test account
```
> yarn start -A login --username TestUserName --password YourSuperSecretPassword
```

or, you can supply `username` and `password` through a local configuration file. It shouldn't be in the shared configs file because ... it's just not a good idea.
A configuration file with the same name as the action file will be loaded by default if no other is supplied. e.g. putting the following in `local-configs/login.json`:

```
{
	"username": ".......",
	"password": "..................."
}
```
and then simply `yarn start -A login` will do.

#### 6. Signup for a new Business account.

1. Enable the store sandbox and sandbox the public API. Otherwise the dummy credit card info won't work.
2. Create a `local-configs/new-user.json` with `newUserGmailPrefix` and `password` field. This `new-user` action relies on the gmail `+` trick to create an account, and suppliying a password is required. It's easy to put a random password, 
but that has given me a hard time closing test accounts. Thus it is implemented this way for now. e.g. Mine looks like this:
```
{
        "newUserGmailPrefix": "supertestingemail",  <- this is not real
        "password": "MySuperSecretPassword"   <- this is also not real, of course.
}
```
3. Run `yarn start -A new-user,pick-free-domain,pick-business-plan,checkout`

This will sign up a new account with the Business plan by appending a random string by the gmail `+` trick. 
e.g. in this case, it could be `supertestingemail+jfsjfiwjadwijdw@gmail.com`.

**Caution:** By doing this rapidly, your test email could be blacklisted. The real blacklisting conditions are unknown to me though.
I have a test email that never gets blacklisted while some others are not so lucky.

#### 7. Create a test account and set ExPlat variation
At the moment of writing this, the configuration properties for setting ExPlat variations can't be supplied by commandline options. Thus, we'd need to create a local config for it.
e.g. Add a `local-configs/test-explat.json` like:
```
{
        "explatExperiments": [
                [ "explat_experiment_slug", "treatment" ]
        ]
}
```
then run:

```
> yarn start -A set-explat,new-user,pick-free-domain,pick-free-plan -C test-explat
```

#### 8. Create my own handy config that isn't appropriate to put in a public repo
I often want to login to one of my test accounts and enable the analytics debug log, thus I have a `local-configs/mine.json` like this:
```
{
  "username": "..........",
  "password": ".............",
	"localStorage": [
		[ "debug", "calypso:analytics:*"]
	]
}

```

then I'll run the following command to begin with:
```
> yarn start -A login -C mine
```

#### 9. Close a test account which owns only one simple site.
```
yarn start -A login,close-account --username xxx --password yyy
```

It's also possible to combine this with some good old shell trick to close test accounts in batch.
Let's say all the test accounts are having the same password `yyy` and they are all listed in a plain text file, `test-accounts`, line-by-line. Then this will do:
```
> cat test-accounts | xargs -L1 yarn start -A login,close-account --password yyy --username
```

#### 10. Use with GNU parallel to run several instances side by side
When you have to compare several variations side by side, combining `dot-handy` with [GNU parallel](https://www.gnu.org/software/parallel/) can be very powerful. 
On a macOS, run `brew install parallel` will have it installed for you.

e.g.

Comparing LOHP side by side per 3 different currencies:
```
> parallel ::: "yarn start --currency TWD" "yarn start --currency PHP" "yarn start --currency EUR"
```
Comparing the control and the treatment variation of an ExPlat variation:
```
> parallel ::: "yarn start -A set-explat,login -C test-account-1,exp-1-control" "yarn start -A set-explat,login -C test-account-2,exp-1-treatment"
```
We all know the domain resolution of `webkit` isnt' affected by `/etc/hosts`. Thus it can happen to be a convenient way to compare sandboxed vs unsandboxed version:
```
> parallel ::: "yarn start -B webkit" "yarn start"
```
