/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Send a message with attachments
* Send a message via direct message (instead of in a public channel)

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node team_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "Attach"

  The bot will send a message with a multi-field attachment.

  Send: "dm"

  The bot will reply with a direct message.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var Botkit = require('botkit');
var request = require('request');
var Promise = require("promise");
var langugeLookup = require('./lib/language-lookup');
var weatherIconLookup = require('./lib/weatherbot');



if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
 debug: false,
});

var pollAttributes = {
  numberToWord: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
  titleLabel: "*_What would you like to title your poll?_*",
  questionLabel: "*_Reply with a comma seperated list of each question for your poll_*",
  channelLabel: "*_What channel would you like to post this poll in?_*"
}

function Poll(title, questions, channel) {
  this.title = title;
  this.questions = questions;
  this.channel = channel;
  this.numberToWord = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
}

controller.spawn({
  token: process.env.token
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});


// controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot,message) {
//     bot.reply(message,"Hello. Dude!");
// })

controller.hears(['attach'],'direct_message,direct_mention',function(bot,message) {

  var attachments = [];
  var attachment = {
    title: 'This is an attachment',
    color: '#FFCC99',
    fields: [],
  }

  attachment.fields.push({
    label: 'Field',
    value: 'A longish value',
    short: false,
  })

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  })

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  })

  attachments.push(attachment);

  bot.reply(message,{
    text: 'See below...',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});



controller.hears(['dm me'],'direct_message,direct_mention',function(bot,message) {
  bot.startConversation(message,function(err,convo) {
    convo.say('Heard ya');
  });

  bot.startPrivateConversation(message,function(err,dm) {
    dm.say('Private reply!');
  })

});

controller.hears(['new poll'], 'direct_message', function(bot, message) {
  bot.startConversation(message, askForPollTitle);
});


askForPollTitle = function(response, convo, poll) {

  convo.ask(pollAttributes.titleLabel, function(response, convo) {
    askForPollQuestions(response, convo);
    convo.next();
  });
};

askForPollQuestions = function(response, convo) {
  convo.ask(pollAttributes.questionLabel, function(response, convo) {
    askForPollChannel(response, convo);
    convo.next();
  });
};

askForPollChannel = function(response, convo) {

  convo.ask(pollAttributes.channelLabel, function(response, convo) {
    reviewPoll(response, convo);
    convo.next();
  });
};

reviewPoll = function(response, convo) {
  var responses = convo.extractResponses();

  var preview = { title: responses[pollAttributes.titleLabel],
                  questions: responses[pollAttributes.questionLabel].split(','),
                  channel:    responses[pollAttributes.channelLabel] };


  convo.say({text: "*Title:* " + preview.title});


  for(var i = 0; i < preview.questions.length; i++) {
    convo.say({text: "*"+ i + ").* " + preview.questions[i]})

  }

  convo.ask("*Does everything look good?* (_double check channel, title, and questions_)",[
    {
        pattern: convo.task.bot.utterances.yes,
        callback: function(response,convo) {
          convo.say('Great! I will create the poll!');
          createPoll(response, convo);
          convo.next();
        }
      },
      {
         pattern: convo.task.bot.utterances.no,
         callback: function(response,convo) {
           convo.say('Ok, lets start over.');
           editPoll(response, convo)
           // do something else...
           convo.stop();
         }
       },
  ]);
}

editPoll = function(response, convo) {

}


createPoll = function(response, convo) {
  var responses = convo.extractResponses();
  var channelRegex = /<#(.*)>/;
  var channel = responses[pollAttributes.channelLabel].match(channelRegex)

  var preview = { title: responses[pollAttributes.titleLabel],
                  questions: responses[pollAttributes.questionLabel].split(','),
                  channel:    channel[1],
                  user: ''};


  var userName = getPollAuthor(convo, convo.source_message.user);


  convo.task.bot.say({
    text: '@' + userName + " asks: *" + preview.title +  '* (_add reaction to vote_)',
    //attachments: attachments,
    channel: preview.channel,
    username: "PollBot",
    icon_emoji:  ":boom:"
  }, function(err, res) {
      if (err) {
          console.log("Error :", err);
      }

      for(var i = 0; i < preview.questions.length; i++) {

        convo.task.bot.say({
          text: ":white_small_square:" + preview.questions[i],
          //attachments: attachments,
          channel: preview.channel,
          username: "PollBot",
          icon_emoji:  ":boom:"
        }, function(err, res) {
            if (err) {
                console.log("Error :", err);
            }
        });
      }

      convo.stop();
  });
}

getPollAuthor = function(convo, userName){
  convo.task.bot.api.users.info({user: userName}, function(err, res) {
    if (err) {
        console.log("USER Error :", err);
    }

      return res.user.name;
  });
}

controller.hears([':rebeccablack:'],'direct_message,direct_mention', function(bot, message){
  var date = new Date();
  var day = date.getDay();
  var replyString = "";

  switch (day) {
    case 1:
      replyString = ":poop: It's Monday and thats totes lame. Like 4 more days until Fraiday - :hearts: :kiss: "
      break;
    case 2:
      replyString = ":tired_face: Only Tuesday and that is a bummer. Like 3 more days until Fraiday - :hearts: :kiss:"
      break
    case 3:
      replyString = ":camel: Sorry its only Humpday, tee-hee, I mean Wednesday. Like 2 more days until Fraiday - :hearts: :kiss:"
      break
    case 4:
      replyString = ":unamused: Thursday is like not like Friday but whateves. Like 1 more days until Fraiday - :hearts: :kiss:"
      break
    case 5:
      replyString = ":tada: :musical_note: It's Friday, gotta get down :musical_note: :tada: - :hearts: :kiss:"
      break
    case 6:
      replyString = ":tropical_drink: Yay! Saturday is like Friday but a different day! :beer:  - :hearts: :kiss:"
      break
    case 7:
      replyString = ":sleeping: Aww mannnnn, It's Sunday and that is almost Monday! - :hearts: :kiss:"
      break
    default:
      replyString = ":rebeccablack: :hearts: :kiss:"
  }

  bot.reply(message, {
    text: replyString,
    username: "Rebecca Black",
    icon_emoji: ":rebeccablack:"
  });
});

controller.hears([':chucknorris:'], 'direct_message,direct_mention', function(bot, message){

  request({url: "http://api.icndb.com/jokes/random", json: true}, function(err, res, json) {
  if (err) {
    throw err;
  }
    bot.reply(message, {
      text: json.value.joke,
      username: "Chuck Norris",
      icon_emoji: ":chucknorris:",
    });
  });
});


controller.hears(['translate (.*)'], 'direct_message,direct_mention,mention', function(bot, message){

  var translatePattern = /(\w.*){2,}\|\W*(\w.*){2,}\s*,\s*(\w.*){2,}/

  if( translatePattern.test(message.match[1]) ) {
      var matchedText = message.match[1].split("|");
      var langs = matchedText[1].trim().split(",");
      var phrase = matchedText[0].trim();
      var fromLang = langugeLookup(langs[0])
      var toLang = langugeLookup(langs[1]);

      requestp("http://api.mymemory.translated.net/get?q=" + phrase +  "&langpair=" + fromLang.code + "|" + toLang.code, true).then(function(data) {
          var attachments = [];
          var attachment = {
          color: '#FFCC99',
          fields: [],
        }

        attachment.fields.push({
          label: 'Field',
          value: data.matches[0].translation,
          short: false,
        });

        attachments.push(attachment);

        bot.reply(message, {
          text: 'Translating *' + phrase + '* from *' + fromLang.name + '* to *' + toLang.name + '*',
          username: "TranslateBot",
          icon_emoji: ":c3po:",
          attachments: attachments
        });

      }, function (err) {
        console.log(err);
      });

  } else {
    bot.reply(message,":no_entry_sign: You have to provide a phrase followed by a `|`  and language pair. _(e.g. How are you | en,es)_");
  }
});

controller.hears(['weather (.*)'], 'direct_message,direct_mention,mention', function(bot, message){

  var apiKey = "&appid=84eda3b0306b5445812e2946ddbacc41";
  var units = "&units=imperial"
  var baseURL = 'http://api.openweathermap.org/data/2.5/weather';

  var matchedText =  message.match[1];
  var paramter = isNaN(matchedText) ? '?q=' + matchedText : '?zip=' + matchedText + ',us';
  var requestURL = baseURL + paramter + apiKey + units;

  console.log("Icon test: ", weatherIconLookup(100))
  requestp(requestURL, true).then(function(data) {
      console.log(data);
      var icon = weatherIconLookup(data.weather[0].id);
      console.log(data.weather[0].id, icon)
      var temp = data.main.temp;

      bot.reply(message, {
        text: "Current temperature in *" + data.name + "* is *" + temp + "º F* with a condition of *" + data.weather[0].description + "*",
        username: "WeatherBot",
        icon_emoji: icon
      })

  },  function (err) {
        console.log(err);
  })


});

function requestp(url, json) {
    json = json || false;
    return new Promise(function (resolve, reject) {
        request({url:url, json:json}, function (err, res, body) {
            if (err) {
                return reject(err);
            } else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code: " + res.statusCode);
                err.res = res;
                return reject(err);
            }
            resolve(body);
        });
    });
}
