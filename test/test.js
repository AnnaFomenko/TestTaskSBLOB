const assert = require('assert');
const chai  = require("chai");
const facebook = require('../modules/facebook');



describe('Facebook Module', function() {
    before(function (done) {
        done()
    });
    describe('', function() {

        it("updateProfile", function(done) {
            facebook.updateProfile('berniesanders','EAACEdEose0cBAKGB7JhJJoOIB5CASDpQ12JL4CAsqw9MkyTZBfnCLB2RiWEN0aTPqZCbnbgykStm796maeIVtpUD0buo4Y5eWnydCjqZB3jyRdFZCIM9F7Vk7fshdwjrkffzPihtfmRJhevbSDZAmCTclkvTHPditubLanvSOcAHF08zsHM1FSOedAWfaER0ZD',  function(err, id){
                if(err){
                } else {

                }
                done();
            });
        });
    });
});