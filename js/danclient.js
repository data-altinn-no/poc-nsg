$(window).on("load", function() {
    $(".js-example").on("click", function(e) {
        e.preventDefault();
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

        console.log("country " + country + " identifier " + identifier);
        $(".js-result").hide();
        $("#js-loader").show();

        if (!country || !identifier || !apikey || country.trim() === '' || identifier.trim() === '')
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
                    var errorMsg = "An error occurred";
                    if (r.responseJSON) {
                        // NSG-standard error body: { "detail": "...", "title": "...", "status": ... }
                        // Fallback via legacy-feltnavn hvis andre backend-versjoner brukes.
                        errorMsg = r.responseJSON.detail
                                || r.responseJSON.detailDescription
                                || r.responseJSON.description
                                || r.responseJSON.title
                                || errorMsg;
                        if (r.status) {
                            errorMsg = "HTTP " + r.status + ": " + errorMsg;
                        }
                    } else if (r.statusText) {
                        errorMsg = r.statusText;
                    }
                    $("#js-error-message").text(errorMsg);
                    $("#js-result-error").show();
                })
                  .always(function() {
                    $btn.removeAttr("disabled");
                    $("#js-loader").hide();
                }).done(function(r) {
                    $("#js-result-formatted").html(getFormatResultHtml(r));
                    $("#js-result-source > pre").html(`POST <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>\n <br>Body: ${syntaxHighlight(body)} <br></br> ${syntaxHighlight(JSON.stringify(r, null, 4))}`);
                    $("#js-result-formatted").show();
                    $("#js-result-source").show();
                });
            }      
    });

});

function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

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
        var result = `<div class="bg"><div style="background-image:url('/gfx/${escapeHtml(getFlagPng($("#txtBusinessId").val().replace(/\s/, "")))}')"</div></div>`;
        return result;
    }

    var result = `
    <div class="bg"><div style="background-image:url('/gfx/${escapeHtml(getFlagPng($("#txtBusinessId").val().replace(/\s/, "")))}')"</div></div>
    <h2>${escapeHtml(r.name)}</h2>
    <small>Legal Identifier: ${escapeHtml(r.identifier?.notation)}</small>
    <dl>
    `;

    if (r.identifier?.issuingAuthorityName) {
        result += `<dt>Issuing authority:</dt><dd>${escapeHtml(r.identifier.issuingAuthorityName)}</dd>`;
    }

    if (r.registrationDate != null) {
        result += `<dt>Registration Date:</dt><dd>${escapeHtml(formatDate(r.registrationDate))}</dd>`;
    }

    // NB: API-en har `postalAddress` og `registeredAddress` på topp-nivå (ikke under `addresses`).
    if (r.postalAddress?.fullAddress) {
        result += "<dt>Postal address:</dt><dd>";
        result += formatAddress(r.postalAddress.fullAddress);
        result += "</dd>";
    }

    if (r.registeredAddress?.fullAddress) {
        result += "<dt>Registered address:</dt><dd>";
        result += formatAddress(r.registeredAddress.fullAddress);
        result += "</dd>";
    }

    if (r.legalform?.name || r.legalform?.code) {
        result += "<dt>Legal form:</dt><dd>";
        result += escapeHtml(r.legalform?.name || "");
        if (r.legalform?.code) {
            result += ` <small>(${escapeHtml(r.legalform.code)})</small>`;
        }
        result += "</dd>";
    }

    if (r.legalStatus?.code) {
        result += "<dt>Legal status code:</dt><dd>";
        result += escapeHtml(r.legalStatus.code);
        result += "</dd>";
    }
    if (r.legalStatus?.name) {
        result += "<dt>Legal status description:</dt><dd>";
        result += escapeHtml(r.legalStatus.name);
        result += "</dd>";
    }

    if (Array.isArray(r.activity) && r.activity.length > 0) {
        result += "<dt>Activity codes (NACE):</dt><dd><ul class='activity-list'>";
        r.activity.forEach(function (act) {
            var line = escapeHtml(act.code);
            if (act.reference) {
                line = `<a href="${escapeHtml(act.reference)}" target="_blank" rel="noopener">${line}</a>`;
            }
            result += `<li>${line}</li>`;
        });
        result += "</ul></dd>";
    }

    result += "</dl>";
    return result;
}

// Deler adressen på semikolon (NSG-standard) og viser hver del på ny linje.
function formatAddress(addr) {
    if (addr == null) return '';
    // Escape først, split på semikolon (både ren og escaped-variant), join med <br>
    return escapeHtml(addr).split(';').join('<br>');
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