$(window).on("load", function() {
    $(".js-example").on("click", function(e) {
        $("#txtBusinessId").val(e.target.innerText);
    })

    $("#btnLookup").on("click", function() {
        let $btn = $(this);
        $btn.attr("disabled", "disabled");
        $.get("https://test-api.data.altinn.no/v1/opendata/NsgCompanyBasicInformation/" + encodeURIComponent($("#txtBusinessId").val()), function(data) {
            console.log(data)
        }, "json")
        .fail(function() {
            console.log( "error" );
        })
        .always(function() {
            $btn.removeAttr("disabled");
        });
    });

});