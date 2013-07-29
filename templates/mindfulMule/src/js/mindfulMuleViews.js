define("mindfulMuleViews", ["jquery", "backbone", "components", "helperViews", "handlebars", "templates"], function($, Backbone, Components, HelperViews, Handlebars) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    // Define view types

    var getTemplate                     = Handlebars.getTemplate,
        MarketItemView                  = Components.ItemView.extend({ template : getTemplate("marketItem"), triggers : {"fastclick .buy" : "buy"} }),
        MarketItemsCollectionView       = Components.IScrollCollectionView.extend({ template: getTemplate("collection") });


    var extendViews = function(model) {

        var theme           = model.get("theme"),
            commonHelpers   = { images : theme.images };

        // Add template helpers to view prototypes
        MarketItemView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return _.extend({
                price 		: this.model.getPrice(),
                imgFilePath : modelAssets.items[this.model.id] || this._imagePlaceholder
            }, commonHelpers);
        };
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {

            _.bindAll(this, "buyItem");

            // Initialize dialog metadata
            this.dialogModal = this.theme.noFundsModal;
            this.messageDialogOptions = {
                background 	: this.dialogModal.background,
                textStyle 	: this.dialogModal.textStyle
            };
            this.loadingModal = _.extend({text : "Loading..."}, this.messageDialogOptions);


            var currency    = this.model.get("currencies").at(0),
                marketItems = currency.get("packs");

            this.marketItemsView = new MarketItemsCollectionView({
                className   : "items",
                collection  : marketItems,
                itemView    : MarketItemView
            });

            this.listenTo(this.marketItemsView, "itemview:buy", this.buyItem);
            this.listenTo(marketItems, "add remove", this.marketItemsView.refreshIScroll);
        },
        ui : {
            contentContainer   : "#content-container"
        },
        onRender: function () {
            this.ui.contentContainer.append(this.marketItemsView.render().el);
            this.marketItemsView.refreshIScroll();
        },
        changeActiveViewByModel : function() {},
        changeViewTo : function() {},
        changeViewToItem : function() {},
        // View event listeners
        buyItem : function (view) {
            this.playSound().wantsToBuyItem(view.model.id);
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 720) : (innerHeight / 1080);
        }
    });


    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});























/*
 changeActiveViewByModel: function (model) {
 var view = this.children.findByCustom(model.id);
 this.changeViewTo(view);
 },
 changeViewTo: function (newview) {
 // Collapse open item in current category
 if (this.activeView.collapseExpandedChild)
 this.activeView.collapseExpandedChild({ noSound: true });

 if (this.activeView != newview) {
 var _activeMenu = this.activeView.$el.hasClass("menu");
 var _pages = this.activeView.$el.parents("div#pages");

 if (_activeMenu) {
 _pages.addClass("slide");
 // add class "on" to the relevant category only
 newview.$el.addClass("on");
 } else {
 if (newview.$el.hasClass("menu")) {
 // new view is menu
 _pages.removeClass("slide");
 } else {
 // switching between two views and NOT going thru menu...
 // add class "on" to the relevant category only
 newview.$el.addClass("on");
 }
 // remove class "on" from "old" category
 this.activeView.$el.removeClass("on");
 }

 newview.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
 newview.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
 $(_pages).animate({ scrollTop: 0 }, "slow");
 });

 this.activeView = newview;
 if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
 }
 },
 changeViewToItem: function (itemId) {
 if (!itemId) return;

 var currencyPacksItem = this.model.marketItemsMap[itemId];
 if (currencyPacksItem) {
 var currency = currencyPacksItem.getCurrencyId();
 this.showCurrencyPacks(currency);
 this.activeView.scrollToItemByModel(currencyPacksItem, 500);
 return;
 }

 var goodsItem = this.model.goodsMap[itemId];
 if (!goodsItem) {
 console.log('View was not changed. Could not find item: "' + itemId + '".');
 return;
 }

 var category = this.model.categoryMap[itemId],
 view     = this.children.findByCustom(category.id);

 // Change to view of given category
 this.changeViewTo(view);
 this.activeView.scrollToItemByModel(goodsItem, 500);
 },

*/
