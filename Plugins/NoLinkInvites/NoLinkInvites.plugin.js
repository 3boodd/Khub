//META{"name":"NoLinkInvites","displayName":"NoLinkInvites","website":"https://khub.kyza.gq/?plugin=NoLinkInvites","source":"https://raw.githubusercontent.com/KyzaGitHub/Khub/master/Plugins/NoLinkInvites/NoLinkInvites.plugin.js"}*//

/*@cc_on
@if (@_jscript)

	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

var NoLinkInvites = (() => {
  const config = {
    info: {
      name: "NoLinkInvites",
      authors: [
        {
          name: "Kyza",
          discord_id: "220584715265114113",
          github_username: "KyzaGitHub"
        }
      ],
      version: "1.0.1",
      description: "Converts invites to \"linkless\" invites by abusing Discord's build overrride code. The link still displays on mobile.",
      github:
        "https://github.com/KyzaGitHub/Khub/tree/master/Plugins/NoLinkInvites",
      github_raw:
        "https://raw.githubusercontent.com/KyzaGitHub/Khub/master/Plugins/NoLinkInvites/NoLinkInvites.plugin.js"
    },
    changelog: [
      // {
      //   "title": "New Stuff",
      //   "items": ["Removed the Revenge Ping button."]
      // }
      // ,
      {
        title: "Bugs Squashed",
        type: "fixed",
        items: ["Works with more invite links now."]
      }
      // 	    ,
      // {
      //   title: "Improvements",
      //   type: "improved",
      //   items: ["Made the plugin exist."]
      // }
      //	,
      // {
      //   "title": "On-going",
      //   "type": "progress",
      //   "items": []
      // }
    ],
    main: "index.js"
  };

  return !global.ZeresPluginLibrary
    ? class {
        constructor() {
          this._config = config;
        }
        getName() {
          return config.info.name;
        }
        getAuthor() {
          return config.info.authors.map((a) => a.name).join(", ");
        }
        getDescription() {
          return config.info.description;
        }
        getVersion() {
          return config.info.version;
        }
        load() {
          PluginUpdater.checkForUpdate(
            "NoLinkInvites",
            this.getVersion(),
            "https://raw.githubusercontent.com/KyzaGitHub/Khub/master/Plugins/NoLinkInvites/NoLinkInvites.plugin.js"
          );
          const title = "Library Missing";
          const ModalStack = BdApi.findModuleByProps(
            "push",
            "update",
            "pop",
            "popWithKey"
          );
          const TextElement = BdApi.findModuleByProps("Sizes", "Weights");
          const ConfirmationModal = BdApi.findModule(
            (m) => m.defaultProps && m.key && m.key() == "confirm-modal"
          );
          if (!ModalStack || !ConfirmationModal || !TextElement)
            return BdApi.alert(
              title,
              `The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`
            );
          ModalStack.push(function(props) {
            return BdApi.React.createElement(
              ConfirmationModal,
              Object.assign(
                {
                  header: title,
                  children: [
                    TextElement({
                      color: TextElement.Colors.PRIMARY,
                      children: [
                        `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`
                      ]
                    })
                  ],
                  red: false,
                  confirmText: "Download Now",
                  cancelText: "Cancel",
                  onConfirm: () => {
                    require("request").get(
                      "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                      async (error, response, body) => {
                        if (error)
                          return require("electron").shell.openExternal(
                            "https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js"
                          );
                        await new Promise((r) =>
                          require("fs").writeFile(
                            require("path").join(
                              ContentManager.pluginsFolder,
                              "0PluginLibrary.plugin.js"
                            ),
                            body,
                            r
                          )
                        );
                      }
                    );
                  }
                },
                props
              )
            );
          });
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
          const {
            DiscordModules,
            Patcher,
            Logger,
            PluginUpdater,
            PluginUtilities,
            WebpackModules,
            DiscordAPI,
            Toasts
          } = Api;

          const {
            MessageStore,
            UserStore,
            ImageResolver,
            ChannelStore,
            GuildStore,
            Dispatcher
          } = DiscordModules;

          return class NoLinkInvites extends Plugin {
            onStart() {
              this.patch();
            }

            onStop() {
              this.unpatch();
            }
            patch() {
              Patcher.before(
                DiscordModules.MessageActions,
                "sendMessage",
                (thisObject, methodArguments, returnValue) => {
                  methodArguments[1].content = methodArguments[1].content.replace(/((?:http:\/\/|https:\/\/)?(?:discord.gg|discordapp.com\/invite)\/(?:.+|\w+))/gi, "https://canary.discordapp.com/__development/link?$1");
                }
              );
            }

            unpatch() {
              Patcher.unpatchAll();
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/