$(window).on("load", function() {
    $(".js-example").on("click", function(e) {
        $("#txtBusinessId").val(e.target.innerText);
    })

    $("#btnLookup").on("click", function() {
        let $btn = $(this);
        $btn.attr("disabled", "disabled");
        $(".js-result").hide();
        $("#js-loader").show();
        $.get("https://dev-api.data.altinn.no/v1/opendata/NsgCompanyBasicInformation/" + encodeURIComponent($("#txtBusinessId").val().replace(/\s/, "")), function(r) {
            $("#js-result-formatted").html(getFormatResultHtml(r));
            $("#js-result-source > pre").html(syntaxHighlight(JSON.stringify(r, null, 4)));
            $("#js-result-formatted").show();
            $("#js-result-source").show();
        }, "json")
        .fail(function(r) {
            console.log(r);
            $("#js-error-message").text(r.responseJSON.detailDescription);
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
    <div class="bg"><div style="background-image:url('/gfx/${getFlagPng(r.Identifier)}')"></div></div>
    <h2>${r.RegisteredOrganization.legalName}</h2>
    <small>Company-ID: ${r.Identifier}</small>
    <dl>
    `;

    if (r.RegisteredOrganization.foundingDate != null) {
        result += `<dt>Founded:</dt><dd>${formatDate(r.RegisteredOrganization.foundingDate)}</dd>`;
    }

    if (r.RegisteredOrganization.hasOwnProperty("dissolutionDate")) {
        result += `<dt>Dissolved:</dt><dd>${formatDate(r.RegisteredOrganization.dissolutionDate)}</dd>`;
    }

    if (r.Address.thoroughfare != null || r.Address.locatorDesignator != null || r.Address.adressArea != null || r.Address.postCode != null || r.Address.postName != null) {
        result += "<dt>Address:</dt><dd>";
        result += `${ein(r.Address.thoroughfare)} ${ein(r.Address.locatorDesignator)}<br>`;
        result += `${ein(r.Address.adressArea, "<br>")}`;
        result += `${ein(r.Address.postCode)} ${ein(r.Address.postName)}</dd></dl>`;
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