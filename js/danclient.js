$(window).on("load", function() {
    $(".js-example").on("click", function(e) {
        $("#txtBusinessId").val(e.target.innerText);
    })

    $("#btnLookup").on("click", function() {
        let $btn = $(this);
        let url = "https://api.data.altinn.no/nordicinformation/v1/registered-organisations";
        let apikey = $("#txtApiKey").val();
        let id = $("#txtBusinessId").val();
        
        let country = id.split(":")[0];
        let identifier = id.split(":")[1];
        let body = JSON.stringify({ "country": country, "notation": identifier });
        let requestGuid = crypto.randomUUID();

        $btn.attr("disabled", "disabled");

        console.log("country " + country + " identifier " + identifier + " apikey " + apikey);
        $(".js-result").hide();
        $("#js-loader").show();

        if (country === undefined || identifier === undefined || apikey === undefined)
            {
                $("#js-error-message").text("Invalid identifier or missing/invalid apikey");
                $("#js-result-error").show();
                $("#js-loader").hide();  
                $btn.prop('disabled', false);
            } else {

                $.ajax({
                    method: "POST",
                    url: url,
                    headers: {
                        'ocp-apim-subscription-key': apikey,
                        'accept' : 'json',
                        'content-type' : 'application/json',
                        'X-Request-Id' : requestGuid
                    },            
                    data: body,
                        
                  })
                  .fail(function(r) {
                    console.log(r);
                    $("#js-error-message").text(r.responseJSON.detailDescription === undefined ? r.responseJSON.description : r.responseJSON.detailDescription);
                    $("#js-result-error").show();
                })
                  .always(function() {
                    $btn.removeAttr("disabled");
                    $("#js-loader").hide();
                }).done(function(r) {
                    $("#js-result-formatted").html(getFormatResultHtml(r));
                    $("#js-result-source > pre").html(`POST <a href="${url}">${url}</a>\n <br>Body: ${syntaxHighlight(body, null, 4)} <br></br> ${syntaxHighlight(JSON.stringify(r, null, 4))}`);
                    $("#js-result-formatted").show();
                    $("#js-result-source").show();
                });
            }      
    });

});


function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function getFormatResultHtml(r) {

    if (r.instance !== undefined)
    {
        console.log("Error: " + r.instance);
        result = `<div class="bg"><div style="background-image:url('/gfx/${getFlagPng($("#txtBusinessId").val().replace(/\s/, ""))}')"></div></div>`;
    } else  {   
    var result = `
    <div class="bg"><div style="background-image:url('/gfx/${getFlagPng($("#txtBusinessId").val().replace(/\s/, ""))}')"></div></div>
    <h2>${r.name}</h2>
    <small>Company-ID: ${r.identifier.notation}</small>
    <dl>
    `;

    if (r.registrationDate != null) {
        result += `<dt>Founded:</dt><dd>${formatDate(r.registrationDate)}</dd>`;
    }

    if (r.addresses?.postalAddress?.fullAddress !== undefined) {
        result += "<dt>Address:</dt><dd>";
        result += r.addresses.postalAddress.fullAddress.split(';').join('<br>');
        result += "</dd>";
    }

    if (r.legalform?.name !== undefined)
    {
        result += "<dt>Organisation form:</dt><dd>";
        result += r.legalform?.name;
        result += "</dd>";
    }

    if (r.legalStatus?.name !== undefined)
        {
            result += "<dt>Status code:</dt><dd>";
            result += r.legalStatus?.code;
            result += "</dd>";
            result += "<dt>Status detail:</dt><dd>"
            result +=  r.legalStatus?.name;
            result += "</dd>";
        }
    }
    return result;
}

function ein(v, a) { //empty-if-null
    return v == null ? "" : v + (a == undefined ? "" : a);
}

function formatDate(str) {
    return (new Date(str)).toLocaleDateString();
}

function getFlagPng(id) {
    console.log("Looking for " + id.split(":")[0] + ".png");
    return id.split(":")[0] + ".png"; 
}

/*
Example:
{
    "activity": [
        {
            "code": "5610",
            "inClassification": "http://data.europa.eu/ux2/nace2/nace2",
            "reference": "http://data.europa.eu/ux2/nace2/5610",
            "sequence": 1
        },
        {
            "code": "9002",
            "inClassification": "http://data.europa.eu/ux2/nace2/nace2",
            "reference": "http://data.europa.eu/ux2/nace2/9002",
            "sequence": 2
        }
    ],
    "identifier": {
        "issuingAuthorityName": "Brønnøysundregistrene",
        "notation": "992119500"
    },
    "legalform": {
        "code": "NO_AS",
        "name": "Aksjeselskap"
    },
    "legalStatus": {
        "code": "NONE",
        "name": "No extraordinary circumstances registered"
    },
    "name": "KRED AS",
    "postalAddress": {
        "fullAddress": "Postboks 385, 8901, BRØNNØYSUND, Norway"
    },
    "registeredAddress": {
        "fullAddress": "Storgata 61, 8900, BRØNNØYSUND, Norway"
    },
    "registrationDate": "2008-01-02"
}*/