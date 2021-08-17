const util = require('util')
const DB = require('../lib/db/postgres');
const Tasmota = require('../lib/plug_ctl/tasmota');
const pm2ctl = require('../lib/pm2_ctl/pm2');
const path = require('path');
const reqPath = path.join(__dirname, '../');
const { default: i18n } = require('new-i18n');
const newi18n = new i18n({ folder: path.join(reqPath, process.env.Sprache), languages: ['de'], fallback: 'de' })

console.log("All Systems Running!")

const Telebot = require('telebot');
const bot = new Telebot({
	token: process.env.TG_BotToken,
	limit: 1000,
        usePlugins: ['commandButton', 'askUser']
});

bot.on(/^\/hauptmenu/i, (msg) => {
    let private;
    if(msg.chat){
        if(msg.chat.type === "private"){private = true}
    }else{
        if(msg.message.chat.type === "private"){private = true}
    }
    if(private){
        let replyMarkup = bot.inlineKeyboard([
            [
                bot.inlineButton(newi18n.translate('de', 'Hauptmenu.Knöpfe.Plugs'), {callback: '/plugscallback'}),
                bot.inlineButton(newi18n.translate('de', 'Hauptmenu.Knöpfe.Controler'), {callback: '/controler'})
            ],
            [
                bot.inlineButton(newi18n.translate('de', 'Hauptmenu.Knöpfe.Stats'), {callback: `/stats`}),
            ]
        ]);

        let username;
        if ('username' in msg.from) {
             username = msg.from.username.toString();
        }else{
            username = msg.from.first_name.toString();
        }

        if(msg.chat){
            return bot.sendMessage(msg.chat.id, newi18n.translate('de', 'Hauptmenu.Text', {Username: username}), {parseMode: 'html', replyMarkup});
        }else{
            return bot.sendMessage(msg.message.chat.id, newi18n.translate('de', 'Hauptmenu.Text', {Username: username}), {parseMode: 'html', replyMarkup});
        }
    }else{
        if(msg.chat){
            return bot.sendMessage(msg.chat.id, newi18n.translate('de', 'Error.NotPrivate'));
        }else{
            return bot.sendMessage(msg.message.chat.id, newi18n.translate('de', 'Error.NotPrivate'));
        }
    }
});

bot.on(/^\/maincallback/i, (msg) => {
    //THIS WILL ONLY WORK WHEN CALLED BY INLINE FUNCTION
    if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}

    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton(newi18n.translate('de', 'Hauptmenu.Knöpfe.Plugs'), {callback: '/plugscallback'}),
            bot.inlineButton(newi18n.translate('de', 'Hauptmenu.Knöpfe.Controler'), {callback: '/controler'})
        ],
        [
            bot.inlineButton(newi18n.translate('de', 'Hauptmenu.Knöpfe.Stats'), {callback: `/stats`}),
        ]
    ]);

        let username;
        if ('username' in msg.from) {
             username = msg.from.username.toString();
        }else{
            username = msg.from.first_name.toString();
        }

        let Message = newi18n.translate('de', 'Hauptmenu.Text', {Username: username})

        if ('inline_message_id' in msg) {
            bot.editMessageText(
                {inlineMsgId: inlineId}, Message,
                {parseMode: 'html', replyMarkup}
            ).catch(error => console.log('Error:', error));
        }else{
            bot.editMessageText(
                {chatId: chatId, messageId: messageId}, Message,
                {parseMode: 'html', replyMarkup}
            )
        }
});

bot.on(/^\/stats/i, (msg) => {
    //THIS WILL ONLY WORK WHEN CALLED BY INLINE FUNCTION
    if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}

    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton(newi18n.translate('de', 'stats.Reload'), {callback: `/stats`}),
        ],
        [
            bot.inlineButton(newi18n.translate('de', 'stats.Back'), {callback: `/maincallback`}),
        ]
    ]);

        let Message = [];
        Message.push(newi18n.translate('de', 'stats.Text'));

        pm2ctl.GetEveryStatus(['HA-Bot','RGB-Proxy']).then(function(Prosess_data) {
            Prosess_data.map(App => {
                Message.push(newi18n.translate('de', 'stats.Status', {Name: App.name, Version: App.pm2_env.version, Status: App.pm2_env.status, Uptime: `${TimeFormat(((new Date().getTime() - App.pm2_env.pm_uptime)/1000).toFixed(0))}`, CPU_P: App.monit.cpu, RAM: (App.monit.memory/1048576).toFixed(2), NODERV: App.pm2_env.node_version, OS: App.pm2_env.OS}));
            })
            if ('inline_message_id' in msg) {
                bot.editMessageText(
                    {inlineMsgId: inlineId}, Message.join("\n\n"),
                    {parseMode: 'html', replyMarkup}
                ).catch(error => console.log('Error:', error));
            }else{
                bot.editMessageText(
                    {chatId: chatId, messageId: messageId}, Message.join("\n\n"),
                    {parseMode: 'html', replyMarkup}
                ).catch(error => console.log('Error:', error));
            }
        }).catch(error => console.log('Error:', error));
});

bot.on(/^\/plugscallback/i, (msg) => {
    //THIS WILL ONLY WORK WHEN CALLED BY INLINE FUNCTION
    if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}
    let KeyboardArray = []

    DB.get.plugs.All().then(function(AllPlugs) {
        let Array = [];
        let count = 0;
        AllPlugs.map((Plug, i) => {
            count++
            Array.push(bot.inlineButton(Plug.name, {callback: `Plugs_Menu_${Plug.plugid}`}))

            if(count > 2 || AllPlugs.lenth-1 > i){
                KeyboardArray.push(Array);
                Array = [];
                count = 0
            }
        })

        KeyboardArray.push([bot.inlineButton(newi18n.translate('de', 'plugscallback.Back'), {callback: '/maincallback'})])

        let replyMarkup = bot.inlineKeyboard(KeyboardArray);


        let Message = newi18n.translate('de', 'plugscallback.Text')

        if ('inline_message_id' in msg) {
            bot.editMessageText(
                {inlineMsgId: inlineId}, Message,
                {parseMode: 'html', replyMarkup}
            ).catch(error => console.log('Error:', error));
        }else{
            bot.editMessageText(
                {chatId: chatId, messageId: messageId}, Message,
                {parseMode: 'html', replyMarkup}
            ).catch(error => console.log('Error:', error));
        }
    });
});

bot.on(/^\/controler/i, (msg) => {
    //THIS WILL ONLY WORK WHEN CALLED BY INLINE FUNCTION
    if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}
    let KeyboardArray = []

    DB.get.controler.All().then(function(AllControlers) {
        let Array = [];
        let count = 0;
        AllControlers.map((Controler, i) => {
            count++
            Array.push(bot.inlineButton(`❌ ${Controler.name} - ${Controler.mode} - ${BoolToString(Controler.state)}`, {callback: `Controler_Button_${Controler.controlerid}_0`}))

            if(count > 0 || AllControlers.lenth-1 > i){
                KeyboardArray.push(Array);
                Array = [];
                count = 0
            }
        });

        KeyboardArray.push([bot.inlineButton(newi18n.translate('de', 'controler.Mode.RGB'), {callback: 'Controler_Modus_RGB'})])
        KeyboardArray.push([bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_1'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_1'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_1'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_1'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_1'})])
        KeyboardArray.push([bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_2'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_2'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_2'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_2'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_2'})])
        KeyboardArray.push([bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_3'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_3'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_3'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_3'}),bot.inlineButton(newi18n.translate('de', 'controler.Platzhalter'), {callback: 'Controler_Platzhalter_3'})])
        KeyboardArray.push([bot.inlineButton(newi18n.translate('de', 'controler.Back'), {callback: '/maincallback'}), bot.inlineButton(newi18n.translate('de', 'controler.Save'), {callback: 'Controler_Save'})])
        let replyMarkup = bot.inlineKeyboard(KeyboardArray);

        let Message = newi18n.translate('de', 'controler.Text')

        if ('inline_message_id' in msg) {
            bot.editMessageText(
                {inlineMsgId: inlineId}, Message,
                {parseMode: 'html', replyMarkup}
            ).catch(error => console.log('Error:', error));
        }else{
            bot.editMessageText(
                {chatId: chatId, messageId: messageId}, Message,
                {parseMode: 'html', replyMarkup}
            ).catch(error => console.log('Error:', error));
        }
    });
});

/* -- Handle Bot -- */

bot.start();

bot.on('callbackQuery', (msg) => {
	if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}

	var data = msg.data.split("_")

    //console.log(msg)

    if(parseInt(data[1]) !== msg.from.id) //Execute always, not user bound
	{   
        if(data[0] === 'delete'){
            if(data[1] === 'this'){
                //delete message here!
                bot.deleteMessage(chatId, messageId).catch(error => console.log('Error:', error));
            }
        }

        if(data[0] === 'Plugs'){
            if(data[1] === 'Menu'){
                Tasmota.UpdatePlugPower(data[2]).then(function(Update) {
                    DB.get.plugs.ByID(data[2]).then(function(Plug) {

                        let replyMarkup = bot.inlineKeyboard([
                            [
                                bot.inlineButton(newi18n.translate('de', `PlugMenü.${Plug[0].state}`), {callback: `Plugs_Switch_${data[2]}_${!Plug[0].state}`})
                            ],
                            [
                                bot.inlineButton(newi18n.translate('de', `PlugMenü.Refresh`), {callback: `Plugs_Menu_${data[2]}`})
                            ],
                            [
                                bot.inlineButton(newi18n.translate('de', 'PlugMenü.Back'), {callback: `/plugscallback`}),
                            ]
                        ]);

                        let Message = newi18n.translate('de', 'PlugMenü.Text', {Steckdose: Plug[0].name, WATT: Plug[0].watt, Kilowatt: Plug[0].kwh_today/1000})

                        if ('inline_message_id' in msg) {
                            bot.editMessageText(
                                {inlineMsgId: inlineId}, Message,
                                {parseMode: 'html', replyMarkup}
                            ).catch(error => console.log('Error:', error));
                        }else{
                            bot.editMessageText(
                                {chatId: chatId, messageId: messageId}, Message,
                                {parseMode: 'html', replyMarkup}
                            ).catch(error => console.log('Error:', error));
                        }
                    }).catch(error => console.log('Error:', error));
                });
            }
            if(data[1] === 'Switch'){
                Tasmota.SwitchPlugPower(data[2], data[3]).then(function(Switch) {
                    if(Switch === "Not_allowed"){
                        bot.answerCallbackQuery(msg.id,{
                            text: newi18n.translate('de', `PlugMenü.${Switch}`),
                            showAlert: true
                        });
                    }else{
                        Tasmota.UpdatePlugPower(data[2]).then(function(Update) {
                            DB.get.plugs.ByID(data[2]).then(function(Plug) {
        
                                let replyMarkup = bot.inlineKeyboard([
                                    [
                                        bot.inlineButton(newi18n.translate('de', `PlugMenü.${Plug[0].state}`), {callback: `Plugs_Switch_${data[2]}_${!Plug[0].state}`})
                                    ],
                                    [
                                        bot.inlineButton(newi18n.translate('de', `PlugMenü.Refresh`), {callback: `Plugs_Menu_${data[2]}`})
                                    ],
                                    [
                                        bot.inlineButton(newi18n.translate('de', 'PlugMenü.Back'), {callback: `/plugscallback`}),
                                    ]
                                ]);
        
                                let Message = newi18n.translate('de', 'PlugMenü.Text', {Steckdose: Plug[0].name, WATT: Plug[0].watt, Kilowatt: Plug[0].kwh_today/1000})
        
                                if ('inline_message_id' in msg) {
                                    bot.editMessageText(
                                        {inlineMsgId: inlineId}, Message,
                                        {parseMode: 'html', replyMarkup}
                                    ).catch(error => console.log('Error:', error));
                                }else{
                                    bot.editMessageText(
                                        {chatId: chatId, messageId: messageId}, Message,
                                        {parseMode: 'html', replyMarkup}
                                    ).catch(error => console.log('Error:', error));
                                }
                            }).catch(error => console.log('Error:', error));
                        });
                    }
                });
            }
        }

        if(data[0] === "Controler"){
            if(data[1] === "Button"){
                msg.message.reply_markup.inline_keyboard.map((ButtonArray, i) => {
                    let callback_data = ButtonArray[0].callback_data.split("_");
                    if(callback_data[0] === "Controler" && callback_data[1] === "Button"){
                        if(callback_data[2] === data[2]){
                            if(callback_data[3] === "1"){
                                msg.message.reply_markup.inline_keyboard[i][0].callback_data = `${callback_data[0]}_${callback_data[1]}_${callback_data[2]}_0`
                                let Text = msg.message.reply_markup.inline_keyboard[i][0].text.replace("✅", "");
                                msg.message.reply_markup.inline_keyboard[i][0].text = `❌${Text}`;
                            }else{
                                msg.message.reply_markup.inline_keyboard[i][0].callback_data = `${callback_data[0]}_${callback_data[1]}_${callback_data[2]}_1`
                                let Text = msg.message.reply_markup.inline_keyboard[i][0].text.replace("❌", "");
                                msg.message.reply_markup.inline_keyboard[i][0].text = `✅${Text}`;
                            }
                        }
                    }
                });
                let Message = msg.message.text;
                let replyMarkup = bot.inlineKeyboard(msg.message.reply_markup.inline_keyboard)
                if ('inline_message_id' in msg) {
                    bot.editMessageText(
                        {inlineMsgId: inlineId}, Message,
                        {parseMode: 'html', replyMarkup}
                    ).catch(error => console.log('Error:', error));
                }else{
                    bot.editMessageText(
                        {chatId: chatId, messageId: messageId}, Message,
                        {parseMode: 'html', replyMarkup}
                    ).catch(error => console.log('Error:', error));
                }
            }

            if(data[1] === "Modus"){
                let AvaibleModes = ['RGB','Static','White'];
                let NewPointer = AvaibleModes.indexOf(data[2]) + 1
                if(NewPointer >= AvaibleModes.length){
                    NewPointer = 0
                }

                msg.message.reply_markup.inline_keyboard.map((ButtonArray, i) => {
                    let callback_data = ButtonArray[0].callback_data.split("_");
                    if(callback_data[0] === "Controler" && callback_data[1] === "Modus"){
                        msg.message.reply_markup.inline_keyboard[i][0].callback_data = `Controler_Modus_${AvaibleModes[NewPointer]}`
                        let Text = newi18n.translate('de', `controler.Mode.${AvaibleModes[NewPointer]}`)
                        msg.message.reply_markup.inline_keyboard[i][0].text = `${Text}`;
                    }

                    if(AvaibleModes[NewPointer] === "RGB"){
                        if(callback_data[0] === "Controler" && callback_data[1] === "Platzhalter"){
                            if(callback_data[2] === "1"){
                                for (let y = 0; y < msg.message.reply_markup.inline_keyboard[i].length; y++) {
                                    msg.message.reply_markup.inline_keyboard[i][y].callback_data = `Controler_Platzhalter_1`
                                    msg.message.reply_markup.inline_keyboard[i][y].text = newi18n.translate('de', `controler.Platzhalter`);
                                }
                            }
                            if(callback_data[2] === "2"){
                                for (let y = 0; y < msg.message.reply_markup.inline_keyboard[i].length; y++) {
                                    msg.message.reply_markup.inline_keyboard[i][y].callback_data = `Controler_Platzhalter_2`
                                    msg.message.reply_markup.inline_keyboard[i][y].text = newi18n.translate('de', `controler.Platzhalter`);
                                }
                            }
                            if(callback_data[2] === "3"){
                                for (let y = 0; y < msg.message.reply_markup.inline_keyboard[i].length; y++) {
                                    msg.message.reply_markup.inline_keyboard[i][y].callback_data = `Controler_Platzhalter_3`
                                    msg.message.reply_markup.inline_keyboard[i][y].text = newi18n.translate('de', `controler.Platzhalter`);
                                }
                            }
                        }
                    }
                    if(AvaibleModes[NewPointer] === "Static"){
                        if(callback_data[0] === "Controler" && callback_data[1] === "Platzhalter"){
                            if(callback_data[2] === "1"){
                                msg.message.reply_markup.inline_keyboard[i][0].callback_data = `Controler_Platzhalter_1_Add_BigPlus`
                                msg.message.reply_markup.inline_keyboard[i][0].text = newi18n.translate('de', `controler.Math.BigPlus`)
                                msg.message.reply_markup.inline_keyboard[i][1].callback_data = `Controler_Platzhalter_1_Add_SmallPlus`
                                msg.message.reply_markup.inline_keyboard[i][1].text = newi18n.translate('de', `controler.Math.SmallPlus`)
                                msg.message.reply_markup.inline_keyboard[i][2].callback_data = `Controler_Platzhalter_1_Static_0`
                                let Text = newi18n.translate('de', `controler.Static.R`)
                                msg.message.reply_markup.inline_keyboard[i][2].text = `${Text} 0`;
                                msg.message.reply_markup.inline_keyboard[i][3].callback_data = `Controler_Platzhalter_1_Add_SmallMinus`
                                msg.message.reply_markup.inline_keyboard[i][3].text = newi18n.translate('de', `controler.Math.SmallMinus`)
                                msg.message.reply_markup.inline_keyboard[i][4].callback_data = `Controler_Platzhalter_1_Add_BigMinus`
                                msg.message.reply_markup.inline_keyboard[i][4].text = newi18n.translate('de', `controler.Math.BigMinus`)
                            }
                            if(callback_data[2] === "2"){
                                msg.message.reply_markup.inline_keyboard[i][0].callback_data = `Controler_Platzhalter_2_Add_BigPlus`
                                msg.message.reply_markup.inline_keyboard[i][0].text = newi18n.translate('de', `controler.Math.BigPlus`)
                                msg.message.reply_markup.inline_keyboard[i][1].callback_data = `Controler_Platzhalter_2_Add_SmallPlus`
                                msg.message.reply_markup.inline_keyboard[i][1].text = newi18n.translate('de', `controler.Math.SmallPlus`)
                                msg.message.reply_markup.inline_keyboard[i][2].callback_data = `Controler_Platzhalter_2_Static_0`
                                let Text = newi18n.translate('de', `controler.Static.G`)
                                msg.message.reply_markup.inline_keyboard[i][2].text = `${Text} 0`;
                                msg.message.reply_markup.inline_keyboard[i][3].callback_data = `Controler_Platzhalter_2_Add_SmallMinus`
                                msg.message.reply_markup.inline_keyboard[i][3].text = newi18n.translate('de', `controler.Math.SmallMinus`)
                                msg.message.reply_markup.inline_keyboard[i][4].callback_data = `Controler_Platzhalter_2_Add_BigMinus`
                                msg.message.reply_markup.inline_keyboard[i][4].text = newi18n.translate('de', `controler.Math.BigMinus`)
                            }
                            if(callback_data[2] === "3"){
                                msg.message.reply_markup.inline_keyboard[i][0].callback_data = `Controler_Platzhalter_3_Add_BigPlus`
                                msg.message.reply_markup.inline_keyboard[i][0].text = newi18n.translate('de', `controler.Math.BigPlus`)
                                msg.message.reply_markup.inline_keyboard[i][1].callback_data = `Controler_Platzhalter_3_Add_SmallPlus`
                                msg.message.reply_markup.inline_keyboard[i][1].text = newi18n.translate('de', `controler.Math.SmallPlus`)
                                msg.message.reply_markup.inline_keyboard[i][2].callback_data = `Controler_Platzhalter_3_Static_0`
                                let Text = newi18n.translate('de', `controler.Static.B`)
                                msg.message.reply_markup.inline_keyboard[i][2].text = `${Text} 0`;
                                msg.message.reply_markup.inline_keyboard[i][3].callback_data = `Controler_Platzhalter_3_Add_SmallMinus`
                                msg.message.reply_markup.inline_keyboard[i][3].text = newi18n.translate('de', `controler.Math.SmallMinus`)
                                msg.message.reply_markup.inline_keyboard[i][4].callback_data = `Controler_Platzhalter_3_Add_BigMinus`
                                msg.message.reply_markup.inline_keyboard[i][4].text = newi18n.translate('de', `controler.Math.BigMinus`)
                            }
                        }
                    }
                    if(AvaibleModes[NewPointer] === "White"){
                        if(callback_data[0] === "Controler" && callback_data[1] === "Platzhalter"){
                            if(callback_data[2] === "1"){
                                msg.message.reply_markup.inline_keyboard[i][0].callback_data = `Controler_Platzhalter_1_Add_BigPlus`
                                msg.message.reply_markup.inline_keyboard[i][0].text = newi18n.translate('de', `controler.Math.BigPlus`)
                                msg.message.reply_markup.inline_keyboard[i][1].callback_data = `Controler_Platzhalter_1_Add_SmallPlus`
                                msg.message.reply_markup.inline_keyboard[i][1].text = newi18n.translate('de', `controler.Math.SmallPlus`)
                                msg.message.reply_markup.inline_keyboard[i][2].callback_data = `Controler_Platzhalter_1_White_0`
                                let Text = newi18n.translate('de', `controler.White.W`)
                                msg.message.reply_markup.inline_keyboard[i][2].text = `${Text} 0`;
                                msg.message.reply_markup.inline_keyboard[i][3].callback_data = `Controler_Platzhalter_1_Add_SmallMinus`
                                msg.message.reply_markup.inline_keyboard[i][3].text = newi18n.translate('de', `controler.Math.SmallMinus`)
                                msg.message.reply_markup.inline_keyboard[i][4].callback_data = `Controler_Platzhalter_1_Add_BigMinus`
                                msg.message.reply_markup.inline_keyboard[i][4].text = newi18n.translate('de', `controler.Math.BigMinus`)
                            }
                            if(callback_data[2] === "2"){
                                for (let y = 0; y < msg.message.reply_markup.inline_keyboard[i].length; y++) {
                                    msg.message.reply_markup.inline_keyboard[i][y].callback_data = `Controler_Platzhalter_2`
                                    msg.message.reply_markup.inline_keyboard[i][y].text = newi18n.translate('de', `controler.Platzhalter`);
                                }
                            }
                            if(callback_data[2] === "3"){
                                for (let y = 0; y < msg.message.reply_markup.inline_keyboard[i].length; y++) {
                                    msg.message.reply_markup.inline_keyboard[i][y].callback_data = `Controler_Platzhalter_3`
                                    msg.message.reply_markup.inline_keyboard[i][y].text = newi18n.translate('de', `controler.Platzhalter`);
                                }
                            }
                        }
                    }
                });

                let Message = msg.message.text;
                let replyMarkup = bot.inlineKeyboard(msg.message.reply_markup.inline_keyboard)
                if ('inline_message_id' in msg) {
                    bot.editMessageText(
                        {inlineMsgId: inlineId}, Message,
                        {parseMode: 'html', replyMarkup}
                    ).catch(error => console.log('Error:', error));
                }else{
                    bot.editMessageText(
                        {chatId: chatId, messageId: messageId}, Message,
                        {parseMode: 'html', replyMarkup}
                    ).catch(error => console.log('Error:', error));
                }
            }

            if(data[1] === "Platzhalter"){
                let AvaibleModes = ['RGB','Static','White'];
                let AvaibleMath = {
                    BigPlus: 50,
                    SmallPlus: 15,
                    SmallMinus: -15,
                    BigMinus: -50
                }
                msg.message.reply_markup.inline_keyboard.map((ButtonArray, i) => {
                    let callback_data = ButtonArray[0].callback_data.split("_");
                    if(callback_data[0] === "Controler" && callback_data[1] === "Platzhalter"){
                        if(callback_data[2] === "1" && data[2] === "1"){
                            if(data[3] === "Add"){
                                let Add_To_Number = 0;
                                if(data[4] === "BigPlus"){
                                    Add_To_Number = AvaibleMath.BigPlus
                                }else if(data[4] === "SmallPlus"){
                                    Add_To_Number = AvaibleMath.SmallPlus
                                }else if(data[4] === "SmallMinus"){
                                    Add_To_Number = AvaibleMath.SmallMinus
                                }else{
                                    Add_To_Number = AvaibleMath.BigMinus
                                }
                                let oldText = msg.message.reply_markup.inline_keyboard[i][2].text.split(" ")
                                let result = Check_RGBValue(Number(oldText[1]) + Add_To_Number)
                                let Color_Text;
                                if(oldText === newi18n.translate('de', `controler.Static.R`)){
                                    Color_Text = newi18n.translate('de', `controler.Static.R`);
                                }else{
                                    Color_Text = newi18n.translate('de', `controler.White.W`);
                                }
                                msg.message.reply_markup.inline_keyboard[i][2].text = `${Color_Text} ${result}`
                                msg.message.reply_markup.inline_keyboard[i][2].callback_data = `${callback_data[0]}_${callback_data[1]}_${callback_data[2]}_${callback_data[3]}_${result}`
                            }
                        }
                        if(callback_data[2] === "2" && data[2] === "2"){
                            if(data[3] === "Add"){
                                let Add_To_Number = 0;
                                if(data[4] === "BigPlus"){
                                    Add_To_Number = AvaibleMath.BigPlus
                                }else if(data[4] === "SmallPlus"){
                                    Add_To_Number = AvaibleMath.SmallPlus
                                }else if(data[4] === "SmallMinus"){
                                    Add_To_Number = AvaibleMath.SmallMinus
                                }else{
                                    Add_To_Number = AvaibleMath.BigMinus
                                }
                                let oldText = msg.message.reply_markup.inline_keyboard[i][2].text.split(" ")
                                let result = Check_RGBValue(Number(oldText[1]) + Add_To_Number)
                                msg.message.reply_markup.inline_keyboard[i][2].text = `${newi18n.translate('de', `controler.Static.G`)} ${result}`
                                msg.message.reply_markup.inline_keyboard[i][2].callback_data = `${callback_data[0]}_${callback_data[1]}_${callback_data[2]}_${callback_data[3]}_${result}`
                            }
                        }
                        if(callback_data[2] === "3" && data[2] === "3"){
                            if(data[3] === "Add"){
                                let Add_To_Number = 0;
                                if(data[4] === "BigPlus"){
                                    Add_To_Number = AvaibleMath.BigPlus
                                }else if(data[4] === "SmallPlus"){
                                    Add_To_Number = AvaibleMath.SmallPlus
                                }else if(data[4] === "SmallMinus"){
                                    Add_To_Number = AvaibleMath.SmallMinus
                                }else{
                                    Add_To_Number = AvaibleMath.BigMinus
                                }
                                let oldText = msg.message.reply_markup.inline_keyboard[i][2].text.split(" ")
                                let result = Check_RGBValue(Number(oldText[1]) + Add_To_Number)
                                msg.message.reply_markup.inline_keyboard[i][2].text = `${newi18n.translate('de', `controler.Static.B`)} ${result}`
                                msg.message.reply_markup.inline_keyboard[i][2].callback_data = `${callback_data[0]}_${callback_data[1]}_${callback_data[2]}_${callback_data[3]}_${result}`
                            }
                        }
                    }
                })

                let Message = msg.message.text;
                let replyMarkup = bot.inlineKeyboard(msg.message.reply_markup.inline_keyboard)
                if ('inline_message_id' in msg) {
                    bot.editMessageText(
                        {inlineMsgId: inlineId}, Message,
                        {parseMode: 'html', replyMarkup}
                    ).catch(error => console.log('Error:', error));
                }else{
                    bot.editMessageText(
                        {chatId: chatId, messageId: messageId}, Message,
                        {parseMode: 'html', replyMarkup}
                    ).catch(error => console.log('Error:', error));
                }
            }

            if(data[1] === "Save"){
                console.log("Saved")
            }
        }
    }
});

/* Functions */

/**
 * This function will return a timestring based on unix time
 * @param {number} seconds
 * @returns {String} Time
 */
function TimeFormat(seconds){
    function pad(s){
      return (s < 10 ? '0' : '') + s;
    }
    var hours = Math.floor(seconds / (60*60));
    var minutes = Math.floor(seconds % (60*60) / 60);
    var seconds = Math.floor(seconds % 60);
  
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}
/**
 * This function will return a string of the plug State based on input
 * @param {boolean} boolean
 * @returns {String} String
 */
function BoolToString(boolean){
    return newi18n.translate('de', `Transform.${boolean}`)
}
/**
 * This function will check if value is below 255 and above or equal 0
 * @param {Number} Number
 * @returns {Number} RGB Save Number
 */
function Check_RGBValue(Number){
    if(Number >= 255){
        return 255
    }else if(Number <= 0){
        return 0
    }else{
        return Number
    }
}