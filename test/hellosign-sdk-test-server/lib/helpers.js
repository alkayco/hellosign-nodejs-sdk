var helpers = module.exports = {
  // Taken from _prepareOpts in the HelloSign NodeJS SDK - last update = 06/26/2015
  formatOptions : function(data){

        if('signers' in data && Array.isArray(data.signers)){
            for(var i=0; i<data.signers.length;i++) {
                for(var signerIndex in data.signers[i]){
                    if(data.signers[i].hasOwnProperty(signerIndex)){
                        if('role' in data.signers[i]){
                            if(signerIndex == 'role'){
                                continue;
                            }
                            data["signers[" + data.signers[i]['role'] + "][" + signerIndex + "]"] = data.signers[i][signerIndex];
                        } else {
                            data["signers[" + i + "][" + signerIndex + "]"] = data.signers[i][signerIndex];
                        }
                    }
                }
            }
            delete data.signers;
        }
        if('cc_email_addresses' in data && Array.isArray(data.cc_email_addresses)){
            for(var i=0; i<data.cc_email_addresses.length;i++) {
                if(typeof data.cc_email_addresses[i]){
                    data["cc_email_addresses[" + i + "]"] = data.cc_email_addresses[i];
                }
            }
            delete data.cc_email_addresses;
        }

        //embedded endpoints adds
        if ('cc_roles' in data && Array.isArray(data.cc_email_addresses)) {
            for(var i=0; i < data.cc_roles.length; i++) {
                if(typeof data.cc_roles[i]){
                    data['cc_roles['+ i + ']'] = data.cc_roles[i];
                }
            }
            delete data.cc_roles;
        }

        if ('ccs' in data && Array.isArray(data.ccs)){
            for (var i=0; i < data.ccs.length; i++){
                data['ccs[' + data.ccs[i]['role_name'] + '][email_address]'] = data.ccs[i].email_address;
            }
            delete data.ccs;
        }

        if ('signer_roles' in data && Array.isArray(data.signer_roles)){
            for(var i=0; i < data.signer_roles.length; i++){
                if(data.signer_roles[i].hasOwnProperty('name')) {
                    data['signer_roles[' + i + '][name]'] = data.signer_roles[i]['name'];
                }
                if(data.signer_roles[i].hasOwnProperty('name')) {
                    data['signer_roles[' + i + '][order]'] = data.signer_roles[i]['order'];
                }
            }
            delete data.signer_roles;
        }

        if('template_ids' in data && Array.isArray(data.template_ids)){
            for(var i=0; i<data.template_ids.length;i++) {
                if(typeof data.template_ids[i]){
                    data["template_ids[" + i + "]"] = data.template_ids[i];
                }
            }
            delete data.template_ids;
        }

        if('templates' in data && Array.isArray(data.templates)){
            for(var i=0; i<data.templates.length;i++) {
                for(var templateIndex in data.templates[i]){
                    if(data.templates[i].hasOwnProperty(templateIndex)){
                        data["templates[" + i + "][" + templateIndex + "]"] = data.templates[i][templateIndex];
                    }
                }
            }
            delete data.templates;
        }

        if ('form_fields_per_document' in data && Array.isArray(data.form_fields_per_document)){
            data.form_fields_per_document = JSON.stringify(data.form_fields_per_document);
        }

        if('clientId' in data) {
            data['client_id'] = data.clientId;
            delete data.clientId;
        }

        for(var prop in data){
            if (data.hasOwnProperty(prop)){
                if (typeof data[prop] === "object" && prop != "files"){
                    for(var paramName in data[prop]){
                        if(data[prop].hasOwnProperty(paramName)){
                            data[prop + "[" + paramName + "]"] = data[prop][paramName];
                        }
                    }
                    delete data[prop];
                }
            }
        }

        if('files' in data && Array.isArray(data.files)){
            // submit as form
            // var form = new FormData();
            // for(var i=0; i<data.files.length;i++) {
            //     form.append("file[" + i + "]", fs.createReadStream(data.files[i]));
            // }
            // delete data.files;
            // for(var paramName in data){
            //     if(data.hasOwnProperty(paramName)){
            //         form.append(paramName, data[paramName]);
            //     }
            // }
            // return {requestData: "", formData: form}
            //TODO: Process files - skipping for now.
            return data;
        } else {
            // var requestData = utils.stringifyRequestData(data || {});
            // return {requestData: requestData, formData: null}
            return data;
        }
    },

    addTestRouteToApp: function(test, app, baseUrl) {
      var url = baseUrl + test.url;

      if (!test.method) throw 'All tests must specify an HTTP method';

      console.log('Creating ' + test.method + ' endpoint for ' + url);
      var method = test.method.toLowerCase();


      app[method](url, function(req, res){
        console.log('hitting route ' + url );
        if (test.body) {
          console.log('test body: ' + JSON.stringify(test.body));
          console.log('req body: ' + JSON.stringify(req.body));
          console.log('parsed body: ' + JSON.stringify(helpers.formatOptions(req.body)));

          var checkResults = helpers.checkRequestParams(req.body, test.body);
          console.log('checkResults: ' + JSON.stringify(checkResults));
        }
        console.log('sending response ' + JSON.stringify(test.response));
        res.status(test.status).set({'content-type' : 'application/json'}).json(test.response).end();
      });

    },

    checkRequestParams: function(requestBody, testBody) {

      var match = true;
      var details = [];

      //TODO: 1) Make this work in all cases - ie for files
      try {
        var processedBody = helpers.formatOptions(testBody);
        var keys = Object.keys(processedBody);
      } catch (ex) {
        details.push('Error parsing test parameters. Check your test spec. Error:' + JSON.stringify(ex));
        return {results: false, details: details}
      }

      keys.forEach(function(key) {
        if (!requestBody.hasOwnProperty(key) || requestBody[key] != processedBody[key]) {
          match = false;
          // TODO: Make reporting better here
          details.push('Error: Mismatch at ' + key + '. Expected ' + processedBody[key] + ' but got ' + requestBody[key] + '.');
        }
      });

      return {results: match, details: details};
    },

    sendRouteNotFoundResponse: function(req, res) {
      res.status(404).send('Endpoint not found in test server spec. Check your URL and HTTP method.');
    }

};
