require('dotenv').config();

/* todo require og stilla dót */
require('isomorphic-fetch');

const cheerio = require('cheerio');
const redis = require('redis');
const util = require('util');
const tabletojson = require('tabletojson');
const jsonQuery = require('json-query');

const redisOption = process.env.REDIS_URL;
const chacheTtl = process.env.REDIS_EXPIRE;

const client = redis.createClient(redisOption);

const asyncGet = util.promisify(client.get).bind(client);
const asyncSet = util.promisify(client.set).bind(client);

/**
 * Listi af sviðum með „slug“ fyrir vefþjónustu og viðbættum upplýsingum til
 * að geta sótt gögn.
 */
const departments = [
  {
    name: 'Félagsvísindasvið',
    slug: 'felagsvisindasvid',
  },
  {
    name: 'Heilbrigðisvísindasvið',
    slug: 'heilbrigdisvisindasvid',
  },
  {
    name: 'Hugvísindasvið',
    slug: 'hugvisindasvid',
  },
  {
    name: 'Menntavísindasvið',
    slug: 'menntavisindasvid',
  },
  {
    name: 'Verkfræði- og náttúruvísindasvið',
    slug: 'verkfraedi-og-natturuvisindasvid',
  },
];

/**
 * Sækir svið eftir `slug`. Fáum gögn annaðhvort beint frá vef eða úr cache.
 *
 * @param {string} slug - Slug fyrir svið sem skal sækja
 * @returns {Promise} Promise sem mun innihalda gögn fyrir svið eða null ef það finnst ekki
 */
async function getTests(slug) {
  let response;
  let text;
  let jsontext;
  let html;
  let deild = [];
  let testinfo = [];
  let table;

  try {
    if (slug === 'felagsvisindasvid')
      response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=1&notaVinnuToflu=0');
    if (slug === 'heilbrigdisvisindasvid')
      response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=2&notaVinnuToflu=0');
    if (slug === 'hugvisindasvid')
      response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=3&notaVinnuToflu=0');
    if (slug === 'menntavisindasvid')
      response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=4&notaVinnuToflu=0');
    if (slug === 'verkfraedi-og-natturuvisindasvid')
      response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=5&notaVinnuToflu=0');
    text = await response.text();

    jsontext = JSON.parse(text);
    //console.log(jsontext.html);
    html = jsontext.html;
    //console.log(html);

    const $ = cheerio.load(html, {normalizeWhitespace: true, xmlMode: true});
    
    const h3 = $('.box h3')
    h3.each((i, el) => {
      const h = $(el);
      console.log(`Fyrirsögn nr. ${i} = ${h.text()}`);

      const table = $(h.next('table'));
      table.each((i, el) => {
        const t = $(el);
        //console.log(`Tafla ${i} undir deild = ${t.text()}`);

        const body = $(t.find('tbody'));
        body.each((i, el) => {
          const b = $(el);
          //console.log(`Body ${i} úr töflu sem er undir deild: ${b.text()}`);

          const row = $(b).find('tr');
          row.each((i, el) => {
            const r = $(el);
            //console.log(`Röð ${i} úr body úr töflu undir deild ${r.text()}`);

            const course = r.find('td:nth-child(1)').text();
            const name = r.find('td:nth-child(2)').text();
            const type = r.find('td:nth-child(3)').text();
            const students = r.find('td:nth-child(4)').text();
            const date = r.find('td:nth-child(5)').text();
            console.log(course, name, type, students, date);

            deild.push({
              course: course,
              name: name,
              type: type,
              students: students,
              date: date,
            });
          });
          console.log('');
        });
      });
    });
  } catch (error) {
    return console.log('Error: ', error);
  }
  return deild;
}

/**
 * Hreinsar cache.
 *
 * @returns {Promise} Promise sem mun innihalda boolean um hvort cache hafi verið hreinsað eða ekki.
 */
async function clearCache() {
  /* todo */
}

/**
 * Sækir tölfræði fyrir öll próf allra deilda allra sviða.
 *
 * @returns {Promise} Promise sem mun innihalda object með tölfræði um próf
 */
async function getStats() {
  
}

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};
