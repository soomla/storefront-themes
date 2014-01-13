define("mindfulMuleViews", ["jquery", "backbone", "components", "helperViews", "handlebars", "templates"], function($, Backbone, Components, HelperViews, Handlebars) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    // Define view types

    var getTemplate = Handlebars.getTemplate,
        SingleUseVirtualGoodView = Components.SingleUseItemView.extend({
            template : getTemplate("singleUseItem"),
            triggers : {click : "buy"}
        }),
        SingleUsePackView = Components.SingleUsePackView.extend({
            template : getTemplate("singleUseItem"),
            triggers : {click : "buy"}
        }),
        LifetimeVirtualGoodView = Components.LifetimeItemView.extend({ template : getTemplate("lifetimeItem") }),
        GoodsCollectionView = Components.IScrollCollectionView.extend({
            template: getTemplate("collection"),
            getItemView: function(item) {

                if (!item) {
                    return Components.BaseCompositeView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    if (item.is("upgradable")) {
//                        itemView = UpgradableItemView;
                    } else {

                        // some logic to calculate which view to return
                        switch (item.getType()) {
                            case "singleUse":
                                itemView = SingleUseVirtualGoodView;
                                break;
                            case "goodPacks":
                                itemView = SingleUsePackView;
                                break;
                            case "lifetime":
                                itemView = LifetimeVirtualGoodView;
                                break;
                        }
                    }
                    return itemView;
                }
            }
        });


    var extendViews = function(model) {

        var theme           = model.assets.theme,
            commonHelpers   = { images : theme.images };

        // Add template helpers to view prototypes
        var templateHelpers = function () {
            var assets = model.assets;
            return _.extend({
                price: this.model.getPrice(),
                buyImage: theme.item.buyImage,
                imgFilePath: assets.getItemAsset(this.model.id)
            }, commonHelpers);
        };
        LifetimeVirtualGoodView.prototype.templateHelpers   = templateHelpers;
        SingleUseVirtualGoodView.prototype.templateHelpers  = templateHelpers;
        SingleUsePackView.prototype.templateHelpers         = templateHelpers;
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


            var category    = this.model.getFirstCategory(),
                goods 		= category.getGoods();

            this.goodsView = new GoodsCollectionView({
                className   : "items",
                collection  : goods
            });

            this.listenTo(this.goodsView, "itemview:buy", this.buyItem);
            this.listenTo(goods, "add remove", this.goodsView.refreshIScroll);
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
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 720) : (innerHeight / 1080);
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
