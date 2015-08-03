var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

var tvCount = 0;

getRipleyJson();
getFalabellaJson();

function getFalabellaJson(){

    url = 'http://www.falabella.com/falabella-cl/category/cat70043/Televisores?No=0&Nrpp=500&userSelectedFormat=list';
    console.log("Cargamos Falabella... Esto puede tardar un ratito!");
    request(url, function(error, response, html){
        if(!error){

            //CREAMOS OBJETO CHEERIO QUE NOS PERMITIRÁ PARSEAR LA PÁGINA CON TOTAL COMODIDAD
            var $ = cheerio.load(html);

            var televisoresFalabella = {};
            var televisor = [];

            tvCount = $('.cajaLP1x').length;

            televisoresFalabella.televisor = televisor;

            //NOS REFERIMOS DIRECTAMENTE AL TAG CON CLASE .cajaLP1x Y BUSCAMOS LA URL PARA EL DETALLE TÉCNICO
            //DEL TELEVISOR DONDE SE ENCUENTRA EL NOMBRE DEL MODELO.
            $('.cajaLP1x').each(function(i, elem) {
                if($(this).find($('.quickView')).find('a').attr('href')!= null){
                    var precio = ""+$(this).find($('.precio1')).text().trim();
                    precio = precio.substr(1,100).trim();
                    var url = "http://www.falabella.com"+$(this).find($('.quickView')).find('a').attr('href');
                    //LLAMAMOS A LA URL EXTRAIDA PARA SACAR EL MODELO DE LA TELEVISION.
                    getFalabellaModelName(url,precio,televisoresFalabella);
                }
            });

        }else{
            console.log("Ha habido un error al recoger las URL de los televisores de Falabella.com");
        }
    });
}

function getFalabellaModelName(url,precio, televisoresFalabella){
    request(url, function(error, response, html){
         if(!error){
             $ = cheerio.load(html);

             $('#contenidoDescripcionPP ul li').each(function(i, elem) {
                 if($(this).text().substr(0,6)=="Modelo"){
                     televisor = {
                         "modelo" : $(this).text().substr(7,500).trim(),
                         "precio" : precio
                     };
                     televisoresFalabella.televisor.push(televisor);
                 }
             });

             tvCount--;

             if(tvCount==0) {
                 //ESCRIBIMOS EL RESULTADO EN LA CARPETA OUTPUT
                 buffer = new Buffer(JSON.stringify(televisoresFalabella, null, 4));
                 fs.open('output/outputFalabella.json', 'w+', function (err, fd) {
                     if (err) {
                         throw 'Error abriendo archivo: ' + err;
                     }

                     fs.write(fd, buffer, 0, buffer.length, null, function (err) {
                         if (err) throw 'Error al escribir archivo: ' + err;
                         fs.close(fd, function () {
                             console.log('Fin de escritura de archivo');
                         })
                     });
                 });
             }

         }else{
            console.log(error);
         }
     })
}

//LA SIGUENTE FUNCIÓN ESCRIBE EN UN FICHERO JSON CON LOS TELEVISORES LED DE RIPLEY.CL
//MODELO JSON : {modelo:"xxxx" , precio:"xxxx"}
function getRipleyJson(){

    //  ESTA URL LISTA TODOS LOS TELEVISORES EN UNA MISMA PÁGINA YA QUE FORZAMOS A QUE LA PAGINA NOS MUESTRE 5000
    //  GRACIAS AL PARAMETRO pageSize=5000;
    url = 'http://www.ripley.cl/ripley-chile/tecnologia/tv/SearchDisplay?urlRequestType=Base&storeId=10151&catalogId=10051&categoryId=12184&urlLangId=-5&beginIndex=0&pageSize=5000';
    console.log("Vamos a empezar a sacar datos de Ripley.cl.\nDependiendo de el estado de la red esto pruede tardar un rato.");

    request(url, function(error, response, html){
        if(!error){

            //CREAMOS OBJETO CHEERIO QUE NOS PERMITIRÁ PARSEAR LA PÁGINA CON TOTAL COMODIDAD
            var $ = cheerio.load(html);

            var modelo = "";
            var precio = "";

            var televisoresRipley = {};
            var televisor = [];

            televisoresRipley.televisor = televisor;

            console.log("Encontrados "+$('.product_listing_container .product_info').length+" televisores LED en Ripley.cl");

            //NOS REFERIMOS DIRECTAMENTE AL TAG CON CLASE .product_info QUE SE ENCUENTRE DENTRO DE ALGUN TAG CON CLASE
            //.product_listing_container. ITERAMOS PARA CADA UNO DE LOS CASOS(TELEVISORES) ENCONTRADOS Y EXTRAEMOS
            //NOMBRE Y PRECIO.
            $('.product_listing_container .product_info').each(function(i, elem) {
                modelo = $(this).find($('.product_name')).text().trim();
                precio = $(this).find($('.price')).text().trim();
                if(modelo!="" && precio !="") {
                    modelo = modelo.substr(modelo.indexOf("\"")+1,20).trim();
                    precio = precio.substr(1,20).trim();
                    televisor = {
                        "modelo" : modelo,
                        "precio" : precio
                    };
                }
                televisoresRipley.televisor.push(televisor);
            });
        }else{
            return error;
        }

        //ESCRIBIMOS EL RESULTADO EN LA CARPETA OUTPUT
        buffer = new Buffer(JSON.stringify(televisoresRipley, null, 4));
        fs.open('output/outputRipley.json', 'w+', function(err, fd) {
            if (err) {
                throw 'Error abriendo archivo: ' + err;
            }

            fs.write(fd, buffer, 0, buffer.length, null, function(err) {
                if (err) throw 'Error al escribir archivo: ' + err;
                fs.close(fd, function() {
                    console.log('Fin de escritura de archivo');
                })
            });
        });

    })
}