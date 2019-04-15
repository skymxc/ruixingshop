// pages/components/customcheckbox/customcheckbox.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    value:null,
    checked:{
      type:Boolean,
      value:false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
      // checked:false,
      // value:null
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTap:function(){
        var detail={
          value : this.data.value,
          checked:!this.data.checked
        }
        this.setData({
          checked:detail.checked
        })
      this.triggerEvent('change',detail);
    }
  }
})
