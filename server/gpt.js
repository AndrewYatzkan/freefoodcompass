require('dotenv').config();

const { Client } = require('@googlemaps/google-maps-services-js');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
console.log('OpenAI API configured');

const client = new Client({});

const preprompt = `@UIUCFreeFood is a Twitter account that tweets whenever there is free food on campus.
The tweets usually contain the type(s) of food, location, and time frame.
Given a tweet, you will identify whether or not it includes this information, and if so, you will extract it in JSON format.
If multiple dates, or a range of dates, are mentioned, use the soonest from the <Sent> date.

<Tweet> Snacks and study time.
<Sent> May 6, 2022 at 2:59 AM
<Food_Info> {}

<Tweet> First Friday Breakfast at EnterpriseWorks on May 6, 2022, from  9:00 - 10:00 am  \t\tInfo?
<Sent> May 6, 2022 at 3:02 AM
<Food_Info> {"food": "Breakfast", "street_address": "EnterpriseWorks", "full_location": "EnterpriseWorks", "time_begin": "5/6/22 9:00 AM", "time_end": "5/6/22 10:00 AM"}

<Tweet> Snacks at the Humanities Professional Resource Center (105 Greg Hall). today (5/6) and all next week (5/6 - 5/9).
<Sent> May 6, 2022 at 11:29 AM
<Food_Info> {"food": "Snacks", "street_address": "Gregory Hall", "full_location": "Humanities Professional Resource Center (Gregory Hall Room 105)", "time_begin": "5/6/22 9:00 AM", "time_end": "5/6/22 10:00 AM"}

<Tweet> Remember to use the form in our bio to submit about events and places with free food and snacks.\t\tLet's enjoy the last week.\t
<Sent> May 9, 2022 at 5:56 PM
<Food_Info> {}

<Tweet> Free grab and go study snacks at engineering hall 1st floor 1130 am -1230 pm may 6, 9, 10, 11
<Sent> May 9, 2022 at 6:25 PM
<Food_Info> {"food": "Grab and go study snacks", "street_address": "Engineering Hall", "full_location": "Engineering Hall 1st floor", "time_begin": "5/6/22 11:30 AM", "time_end": "5/6/22 12:30 PM"}

<Tweet> Free food today at ECEB from 3:30-5:30 PM during the Grad 🎓 Open House
<Sent> May 13, 2022 at 3:15 PM
<Food_Info> {"food": "Unknown", "street_address": "Electrical and Computer Engineering Building", "full_location": "Electrical and Computer Engineering Building", "time_begin": "5/13/22 3:30 PM", "time_end": "5/13/22 5:30 PM"}

<Tweet> See you in August.
<Sent> May 14, 2022 at 5:28 PM
<Food_Info> {}

<Tweet> We're back!!!
<Sent> Aug 24, 2022 at 8:41 PM
<Food_Info> {}

<Tweet> Free Einstein Bros Bagels at the Illini Union Courtyard until 9 PM and a bit more
<Sent> Aug 24, 2022 at 8:47 PM
<Food_Info> {"food": "Einstein Bros Bagels", "street_address": "Illini Union", "full_location": "Illini Union Courtyard", "time_begin": "8/24/22 8:47 PM", "time_end": "8/24/22 9:15 PM"}

<Tweet> \t\tFree Donuts at the Women's Resources Center.\t\t9-11 AM \t\tAll are welcome.
<Sent> Aug 24, 2022 at 9:16 PM
<Food_Info> {"food": "Donuts", "street_address": "Women's Resources Center", "full_location": "Women's Resources Center", "time_begin": "8/25/22 9:00 AM", "time_end": "8/25/22 11:00 AM"}

<Tweet> Free Pizza (Illini Union 323) probably until 8 PM.\t\toStem Meeting.
<Sent> Aug 25, 2022 at 7:37 PM
<Food_Info> {"food": "Pizza", "street_address": "Illini Union", "full_location": "Illini Union Room 323", "time_begin": "8/25/22 7:37 PM", "time_end": "8/25/22 8:00 PM"}

<Tweet> Free coffee, donuts, and bagels every Tuesday at 10:00 AM!\t\tStop by the hallway outside of the International and Area Studies (IAS) Library, on the third floor of the Main Library Building, Room 321.
<Sent> Sep 18, 2022 at 1:13 PM
<Food_Info> {"food": "Coffee, donuts, and bagels", "street_address": "International and Area Studies (IAS) Library", "full_location": "Main Library Building Room 321", "time_begin": "9/20/22 10:00 AM", "time_end": "9/20/22 11:00 AM"}

<Tweet> Has the \t@UIUCFreeFood\t been helpful?\t\tCan you share any stories or any times you've used it?
<Sent> Sep 18, 2022 at 3:37 PM
<Food_Info> {}

<Tweet> Lunch On Us by \t@LaCasaIllinois\t \t\tFree food tomorrow at 1203 West Nevada, Urbana. \t\tStop by Thursday, September 1st between 12-1 PM to enjoy delicious food on \t@LaCasaIllinois\t.
<Sent> Aug 31, 2022 at 5:37 PM
<Food_Info> {"food": "Lunch", "street_address": "1203 West Nevada, Urbana", "full_location": "1203 West Nevada, Urbana", "time_begin": "9/1/22 12:00 PM", "time_end": "9/1/22 1:00 PM", "note": "From @LaCasaIllinois"}

<Tweet> Come Learn about CS RSOs at the ACM Open House.\t\tFREE PIZZA .\t\tSiebel Center for Computer Science room 1404 at 6:30 PM
<Sent> Sep 1, 2022 at 10:17 AM
<Food_Info> {"food": "Pizza", "street_address": "Siebel Center for Computer Science", "full_location": "Siebel Center for Computer Science Room 1404", "time_begin": "9/1/22 6:30 PM", "time_end": "9/1/22 7:30 PM", "note": "Learn about CS RSOs"}

<Tweet> We're close to releasing a new feature where we TEXT YOU instead of tweeting. \t\tWould you be interested in that?
<Sent> Sep 1, 2022 at 10:19 AM
<Food_Info> {}

<Tweet> FREE SNACKS\t\tCrafts + Snacks: Bracelets and Brownies\t\tat the \t@IlliniUnion\t \t\tat 7 PM TODAY
<Sent> Sep 1, 2022 at 3:10 PM
<Food_Info> {"food": "Brownies", "street_address": "Illini Union", "full_location": "Illini Union", "time_begin": "9/1/22 7:00 PM", "time_end": "9/1/22 8:00 PM"}

<Tweet> S'mores Roast\tSaturday, September 3rd\t6-8 PM\tIllini Grove\t\tCome hang out with us in Illini Grove! (behind PAR) Free food, friends, and fire.\t\tACM Illinois.
<Sent> Sep 1, 2022 at 5:57 PM
<Food_Info> {"food": "S'mores", "street_address": "Illini Grove", "full_location": "Illini Grove", "time_begin": "9/3/22 6:00 PM", "time_end": "9/3/22 8:00 PM", "note": "ACM Illinois"}

<Tweet> Free pizza at 3101 Lu MEB on Tuesday, Septemper 6.\t\t12:00 - 1:00 PM
<Sent> Sep 5, 2022 at 11:14 AM
<Food_Info> {"food": "Pizza", "street_address": "Sidney Lu Mechanical Engineering Building", "full_location": "Sidney Lu Mechanical Engineering Building", "time_begin": "9/6/22 12:00 PM", "time_end": "9/6/22 1:00 PM"}

<Tweet> Coffee/Lunch Hours with the CS Director of Graduate Studies.\t\tLunch and free snacks.\t\tTime? Sep 8, 2022   11:30 am - 1:00 pm  \t\tWhere? Lower level patio of Siebel CS
<Sent> Sep 7, 2022 at 5:57 PM
<Food_Info> {"food": "Lunch and snacks", "street_address": "Siebel Center for Computer Science", "full_location": "Siebel CS lower level patio", "time_begin": "9/8/22 11:30 AM", "time_end": "9/8/22 1:00 PM", "note": "with the CS Director of Graduate Studies"}

<Tweet> Welcome Back Pizza Party at Lucy Ellis Lounge.\t\tSep 8, 2022   5:00 pm   7:00 pm
<Sent> Sep 7, 2022 at 9:32 PM
<Food_Info> {"food": "Pizza", "street_address": "Lucy Ellis Lounge", "full_location": "Lucy Ellis Lounge", "time_begin": "9/8/22 5:00 PM", "time_end": "9/8/22 7:00 PM"}

<Tweet> School of Art & Design Welcome Back Picnic\t\tSep 9, 2022   5:00 pm - 8:00 pm\t\tFree food is included!
<Sent> Sep 9, 2022 at 1:07 PM
<Food_Info> {"food": "Picnic food", "street_address": "School of Art & Design", "full_location": "School of Art & Design", "time_begin": "9/9/22 5:00 PM", "time_end": "9/9/22 8:00 PM"}

<Tweet> Free food at Gies from 3-5 PM!
<Sent> Sep 9, 2022 at 2:57 PM
<Food_Info> {"food": "Unknown", "street_address": "Gies College of Business", "full_location": "Gies College of Business", "time_begin": "9/9/22 3:00 PM", "time_end": "9/9/22 5:00 PM"}

<Tweet> More than 10 FREE FOOD EVENTS are scheduled for next week!\t\tDon't feel like cooking, waiting in the dining hall, or simply want free food?\t\tFollow \t@UIUCFreeFood\t, share with your friends, and turn on notifications!!!!!\t\tTHE UIUC FREE FOOD TWITTER BOT!
<Sent> Sep 9, 2022 at 3:27 PM
<Food_Info> {}

<Tweet> FREE Food in partnership with the \t@UIUCTalkshow
<Sent> Sep 9, 2022 at 6:51 PM
<Food_Info> {}

<Tweet> Free food on Siebel Computer Science Lower Floor!\t\tAppetizers\tMeatballs \tChicken\tAnd DESSERTS!\t\tProbably until 7 PM!
<Sent> Sep 12, 2022 at 4:26 PM
<Food_Info> {"food": "Appetizers, meatballs, chicken, and desserts", "street_address": "Siebel Center for Computer Science", "full_location": "Siebel Computer Science Lower Floor", "time_begin": "9/12/22 4:26 PM", "time_end": "9/12/22 7:00 PM"}

<Tweet> EVERY TUESDAY AT NOON\t\tFREE Food at the Asian American Cultural Center.\t\t1210 W Nevada St. Urbana IL\t\tDate Sep 13, 2022   12:00 - 1:00 pm
<Sent> Sep 12, 2022 at 6:17 PM
<Food_Info> {"food": "Unknown", "street_address": "1210 W Nevada St. Urbana IL", "full_location": "Asian American Cultural Center", "time_begin": "9/13/22 12:00 PM", "time_end": "9/13/22 1:00 PM"}

<Tweet> FREE Dinner at the Native American House.\t\tLocation: 1206 West Nevada Street Urbana, Illinois 61801\t\tDate: Sep 13, 2022   5:00 - 6:00 pm \t\tBI-WEEKLY!!!!
<Sent> Sep 13, 2022 at 3:31 PM
<Food_Info> {"food": "Dinner", "street_address": "1206 West Nevada Street Urbana, Illinois 61801", "full_location": "Native American House", "time_begin": "9/13/22 5:00 PM", "time_end": "9/13/22 6:00 PM"}

<Tweet> Cookies and coffee at loomis 3:30- idk when
<Sent> Sep 14, 2022 at 3:49 PM
<Food_Info> {"food": "Cookies and coffee", "street_address": "Loomis Laboratory Of Physics", "full_location": "Loomis Laboratory", "time_begin": "9/14/22 3:30 PM", "time_end": "9/14/22 4:30 PM"}

<Tweet> Coffee and cookies at Loomis right now!
<Sent> Sep 14, 2022 at 3:49 PM
<Food_Info> {"food": "Coffee and cookies", "street_address": "Loomis Laboratory Of Physics", "full_location": "Loomis Laboratory", "time_begin": "9/14/22 3:49 PM", "time_end": "9/14/22 4:30 PM"}

<Tweet> Coding competition and FREE PIZZA \t\tThe competition will take place in Siebel Center for Computer Science – Room 0216 (in the basement), and we will have free pizza  from Papa Johns for all attendees! \t\tTONIGHT (09/15) from 6–8:30 PM
<Sent> Sep 15, 2022 at 12:05 PM
<Food_Info> {"food": "Papa John's Pizza", "street_address": "Siebel Center for Computer Science", "full_location": "Siebel Center for Computer Science Room 0216 (basement)", "time_begin": "9/15/22 6:00 PM", "time_end": "9/15/22 8:30 PM", "note": "Coding competition"}

<Tweet> Free food and appetizers at the Siebel Center for Design
<Sent> Sep 15, 2022 at 5:23 PM
<Food_Info> {"food": "Unknown", "street_address": "Siebel Center for Design", "full_location": "Siebel Center for Design", "time_begin": "9/15/22 5:23 PM", "time_end": "9/15/22 6:00 PM"}

<Tweet> Free PIZZA ARC bouldering wall NOW and candy
<Sent> Dec 8, 2022 at 2:20 PM
<Food_Info> {"food": "Pizza and candy", "street_address": "Activities and Recreation Center", "full_location": "ARC Bouldering Wall", "time_begin": "12/8/22 2:20 PM", "time_end": "12/8/22 3:00 PM"}
`;

function formatTwitterDate(ds) {
    let d = new Date(ds);
    let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    let hour = d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return `${month} ${d.getDate()}, ${d.getFullYear()} at ${hour}`;
}


async function processTweet({id, text, created_at}) {
  let result = await completion(`${preprompt}<Tweet>${text.replace(/\n/g, '\t')}\n<Sent> ${formatTwitterDate(created_at)}\n<Food_Info>`);
  try {
    result = JSON.parse(result);
    let keys = ['food', 'street_address', 'full_location', 'time_begin', 'time_end'];
    for (let key of keys) if (!result[key]) return {error: 'Missing keys'};

    let coordinates = await geocode(result.street_address);
    if (!coordinates) return {error: 'Couldn\'t geocode'};

    return {id, text, coordinates, ...result};
  } catch (e) {
    return {error: e};
  }
}

async function completion(prompt) {
  try {
    const completion = await openai.createCompletion({
      stop: '\n',
      model: process.env.GPT_MODEL,
      temperature: 0,
      max_tokens: 300,
      prompt
    });
    const output = completion.data.choices.pop();
    return output.text;
  } catch (e) {
    console.log(e);
  }
}

const UIUC_BOUNDS = {
  northeast: {
    lat: 40.1478735,
    lng: -88.1835567
  },
  southwest: {
    lat: 40.0644773,
    lng: -88.3016202
  }
}

async function geocode(address) {
  try {
    let res = await client.geocode({
      params: {
        address,
        bounds: UIUC_BOUNDS,
        key: process.env.GOOGLE_API_KEY
      }
    });
    let coords = res.data.results[0].geometry.location;
    return {latitude: coords.lat, longitude: coords.lng}
  } catch (e) {
    // console.log(e);
    return false;
  }
}

// processTweet({id: 1, text: `FREE FOOD 

// DCL 2240  from 4pm - 5pm today for snacks, ice cream, and other goodies to help you power through!

// Monday through Wednesday!
// `, created_at: '2022-12-14T20:26:00.000Z'})

module.exports = { processTweet };
