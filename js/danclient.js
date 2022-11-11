$(window).on("load", function() {
    $(".js-example").on("click", function(e) {
        $("#txtBusinessId").val(e.target.innerText);
    })

    $("#btnLookup").on("click", function() {
        let $btn = $(this);
        let url = "https://dev-api.data.altinn.no/v1/opendata/NsgCompanyBasicInformation/" + encodeURIComponent($("#txtBusinessId").val().replace(/\s/, ""));
        $btn.attr("disabled", "disabled");
        $(".js-result").hide();
        $("#js-loader").show();
        $.get(url, function(r) {
            $("#js-result-formatted").html(getFormatResultHtml(r));
            $("#js-result-source > pre").html(`GET <a href="${url}">${url}</a>\n${syntaxHighlight(JSON.stringify(r, null, 4))}`);
            $("#js-result-formatted").show();
            $("#js-result-source").show();
        }, "json")
        .fail(function(r) {
            console.log(r);
            $("#js-error-message").text(r.responseJSON.detailDescription === undefined ? r.responseJSON.description : r.responseJSON.detailDescription);
            $("#js-result-error").show();
        })
        .always(function() {
            $btn.removeAttr("disabled");
            $("#js-loader").hide();
        });
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

    return result;
}

function ein(v, a) { //empty-if-null
    return v == null ? "" : v + (a == undefined ? "" : a);
}

function formatDate(str) {
    return (new Date(str)).toLocaleDateString();
}

function getFlagPng(id) {
    return id.split(":")[0] + ".png"; 
}