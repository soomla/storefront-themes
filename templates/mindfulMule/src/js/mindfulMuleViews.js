define("mindfulMuleViews", ["jquery", "backbone", "components", "helperViews", "handlebars", "templates"], function($, Backbone, Components, HelperViews, Handlebars) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    // Define view types

    var getTemplate         = Handlebars.getTemplate,
        GoodView            = Components.LifetimeItemView.extend({ template : getTemplate("good") }),
        GoodsCollectionView = Components.IScrollCollectionView.extend({ template: getTemplate("collection") });


    var extendViews = function(model) {

        var theme           = model.get("theme"),
            commonHelpers   = { images : theme.images };

        // Add template helpers to view prototypes
        GoodView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return _.extend({
                price 		: this.model.getPrice(),
                buyImage    : theme.item.buyImage,
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


            var category    = this.model.getFirstCategory(),
                goods 		= category.get("goods");

            this.goodsView = new GoodsCollectionView({
                className   : "items",
                collection  : goods,
                itemView    : GoodView
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


    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});
