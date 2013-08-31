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
            },
            calculateIscrollWidth : function(childCount, childWidth) {

                // Add an extra 25px for each element because of width problems in the dashboard
                return (childWidth + 25) * childCount;
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
                collection  : goods
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
