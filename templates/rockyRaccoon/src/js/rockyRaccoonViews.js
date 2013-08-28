define("rockyRaccoonViews", ["jquery", "backbone", "components", "helperViews", "handlebars", "cssUtils", "templates"], function($, Backbone, Components, HelperViews, Handlebars, CssUtils) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    var animationend = CssUtils.getAnimationendEvent();


    // Define view types

    var getTemplate                 = Handlebars.getTemplate,
        LifetimeVirtualGoodView     = Components.LifetimeItemView.extend({ template : getTemplate("lifetimeItem"), triggers : {fastclick : "buy"} }),
        SingleUseVirtualGoodView    = Components.ItemView.extend({
            className : "item single-use",
            template : getTemplate("singleUseItem"),
            triggers : { fastclick : "buy" },
            ui : {
                balance : ".item-balance"
            },
            addEvents : function() {
                Components.ItemView.prototype.addEvents.apply(this);
                this.model.on("change:balance", this.animateBalance, this);
            },
            animateBalance : function() {
                var balance = this.ui.balance;
                balance.one(animationend, function() {
                    balance.removeClass("changed");
                }).addClass("changed");
            }
        }),
        GoodsCollectionView = Components.HorizontalIScrollCollectionView.extend({
            template: getTemplate("collection"),
            getItemView: function(item) {

                if (!item) {
                    return Components.HorizontalIScrollCollectionView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    // some logic to calculate which view to return
                    switch (item.get("type")) {
                        case "singleUse":
                            itemView = SingleUseVirtualGoodView;
                            break;
                        case "lifetime":
                            itemView = LifetimeVirtualGoodView;
                            break;
                    }
                    return itemView;
                }
            }
        });


    var extendViews = function(model) {

        var theme = model.get("theme");
        var commonTemplateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return {
                price 		: this.model.getPrice(),
                imgFilePath : modelAssets.items[this.model.id] || this._imagePlaceholder,
                images      : theme.images
            };
        };

        // Add template helpers to view prototypes
        LifetimeVirtualGoodView.prototype.templateHelpers = commonTemplateHelpers;
        SingleUseVirtualGoodView.prototype.templateHelpers = commonTemplateHelpers;
    };



    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {

            _.bindAll(this, "buyItem");

            // Initialize dialog metadata
            this.dialogModal = this.theme.loadingModal;
            this.messageDialogOptions = {
                background 	: this.dialogModal.background,
                textStyle 	: this.dialogModal.textStyle
            };
            this.loadingModal = _.extend({text : "Loading..."}, this.messageDialogOptions);


            var category    = this.model.getFirstCategory(),
                goods       = category.get("goods");

            this.goodsView = new GoodsCollectionView({
                className   : "items",
                collection  : goods,
                itemView    : LifetimeVirtualGoodView
            });

            this.listenTo(this.goodsView, "itemview:buy", this.buyItem);
            this.listenTo(goods, "add remove", this.goodsView.refreshIScroll);

            // Re-render the entire list when goods are added \ removed  to prevent
            // a UI artifact of text mis-alignment due to flipping sides of even \ odd items
            this.listenTo(goods, "add remove", this.goodsView.render);
        },
        ui : {
            contentContainer   : "#content-container"
        },
        events : {
            "fastclick #quit-button" : "leaveStore"
        },
        onRender: function () {
            this.ui.contentContainer.append(this.goodsView.render().el);
            this.goodsView.refreshIScroll();
        },
        changeActiveViewByModel : function() {},
        changeViewTo : function() {},
        changeViewToItem : function() {},
        // View event listeners
        buyItem : function (view) {
            this.playSound().wantsToBuyItem(view.model.id);
        },
        zoomFunction : function() {
            return (innerWidth / innerHeight) > (3/2) ? (innerHeight / 1280) : (innerWidth / 1920);
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
