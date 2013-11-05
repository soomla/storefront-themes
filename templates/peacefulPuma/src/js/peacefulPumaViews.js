define("peacefulPumaViews", ["jquery", "backbone", "components", "helperViews", "handlebars", "cssUtils", "templates"], function($, Backbone, Components, HelperViews, Handlebars, CssUtils) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    var animationend = CssUtils.getAnimationendEvent();


    // Define view types

    var getTemplate                 = Handlebars.getTemplate,
        LifetimeVirtualGoodView     = Components.LifetimeItemView.extend({ template : getTemplate("lifetimeItem"), triggers : {fastclick : "buy"}  }),
        SingleUseVirtualGoodView    = Components.SingleUseItemView.extend({
            template : getTemplate("singleUseItem"),
            triggers : { fastclick : "buy" },
            ui : {
                balance : ".item-balance"
            },
            addEvents : function() {
                Components.SingleUseItemView.prototype.addEvents.apply(this);
                this.listenTo(this.model, "change:balance", this.animateBalance, this);
            },
            animateBalance : function() {
                var balance = this.ui.balance;
                balance.one(animationend, function() {
                    balance.removeClass("changed");
                }).addClass("changed");
            }
        }),
        GoodsCollectionView         = Components.IScrollCollectionView.extend({
            template: getTemplate("collection"),
            getItemView: function(item) {

                if (!item) {
                    return Components.IScrollCollectionView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    // some logic to calculate which view to return
                    switch (item.getType()) {
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
            var assets = model.assets;
            return {
                odd         : (this.model.collection.indexOf(this.model) + 1) % 2 == 1,
                price 		: this.model.getPrice(),
                imgFilePath : assets.getItemAsset(this.model.id),
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
        emulateActiveElements : "#quit-button", // valid jQuery selector
        onRender: function () {
            this.ui.contentContainer.append(this.goodsView.render().el);
            this.goodsView.refreshIScroll();
        },
        changeActiveViewByModel : function() {},
        changeViewToItem: function (itemId) {
            if (!itemId) return;
            var good = this.model.goodsMap[itemId];
            setTimeout(_.partial(this.goodsView.scrollToItemByModel, good, 500), 0);
        },
        // View event listeners
        buyItem : function (view) {
            this.playSound().wantsToBuyItem(view.model.id);
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > (4/3) ? (innerWidth / 1536) : (innerHeight / 2048);
        }
    });
    StoreView.mixinActiveTouchEmulation();


    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});
