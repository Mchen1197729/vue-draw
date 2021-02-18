## 画板小项目的一些知识点总结

### 画图的原理:
    画图分为三个步骤：
        1.点击鼠标左键一次,选择起始点(对于直线、矩形来说就是确定起点,对于圆形来说就是确定圆心)
        2.拖动鼠标选择终点,在这个阶段不断的修改图形终点的坐标属性(对于直线、矩形来说就是确定终点,对于圆形来说就是确定圆的半径)
        3.再次点击鼠标左键确定图形的终点,至此画图完成

### 1.Event接口中两个重要的属性
    e.currentTarget:只读属性 永远指向绑定事件的元素
    e.target:只读属性 指向当前发生事件的元素 该属性常用来实现事件委托
             如果需要给很多个元素都绑定同一个事件,那么可以考虑给它们的共同的父元素绑定该事件,当事件触发后可以通过event.target属性来判断当前触发事件的元素是谁并且做出回应,从而避免重复的绑定。

### 2.MouseEvent接口中的一些关于坐标的属性
    例如,画板中使用鼠标的点击事件来确定形状的起点在画布中的坐标,给画布的元素绑定点击事件的监听
        坐标系都是左上角是原点(0,0),向右是X轴正方向,向下是Y轴正方向
    (e.screenX,e.screenY)点表示鼠标点击的点在整个电脑屏幕(包括浏览器的工具栏和地址栏的区域)这个坐标系中的坐标
    (e.pageX,e.pageY)点表示鼠标点击的点在整个文档(document,包括浏览器的工具栏和地址栏的区域)这个坐标系中的坐标
    (e.offsetX,e.offsetY)点表示鼠标点击的点在当前发生鼠标点击事件的这个元素的坐标系中的坐标

### 3.实现画布整体的移动和缩放功能的细节
    一张画布就是一个svg标签,当初始化成功时,向其中添加一个group标签,之后添加的各种形状都是添加在这个group标签中。
    实现画布的整体移动和缩放也就是实现这个group标签的移动和缩放。
        具体的原理:每一次进行移动或者缩放之前先获取当前group的整体的缩放和移动的值,
                 然后将此次需要进行的移动和缩放跟这个值进行计算得到一个新的整体的值，然后按照这个值进行移动和缩放。

### 4.利用a连接实现在浏览器端保存文件
    a链接除了有超链接的功能外,还可以利用其href和download属性实现浏览器端保存文件。
    其中download属性是要保存的文件的文件名,href属性的值是要保存的文件的内容,如果是文本类型的文件,则需要给其添加前缀`data:text/plain,`,例如
    <a href="data:text/plain,HelloWorld" download="hello.txt">保存文件</a>
    在具体实现时,在文档中添加一个普通的a链接,并设置其display为none,当点击保存文件的按钮时,获取这个a链接的dom元素,并设置其href属性和download属性,
    然后调用该dom元素的click()方法,主动触发a链接的点击事件,这样就实现了让浏览器主动保存文件。

### 5.让用户选择导入计算机中的文件并且读取被选择的文件的内容
    浏览器想要操作并读取计算机中的文件需要通过<input type="file"/>这个标签以及FileReader对象
    具体实现:创建一个隐藏的文本域,并且需要监听该文本域的onchange事件,当点击打开文件按钮时,获取该文本域对应的dom元素,调用其click()方法,
    然后当用户选择完文件后,会触发文本域的onchange事件,事件对象中,event.target.files[0]就是用户选择的文件,在onchange事件的回调中创建FileReader对象用来读取改文件。
    代码
    let reader = new FileReader()
    reader.onload = e =>{
        // 读取成功
        console.log(e.target.result)
    }
    reader.onerror = error =>{
        // 读取失败
        console.log('读取失败')
    }
    // 开始读取文件
    reader.readAsText(event.target.files[0])
    
### 6.创建图元
    从用户计算机中选择图片文件,输入图元名称,然后将选择的图元的图片的base64格式的字符串以及图元名称以及唯一id值(Date.now())添加到data的属性imagesSources里
    然后再将最新的this.imageSources数组保存在localStorage中。


### 7.缩放功能
    监听滚轮的滚动事件 
        谷歌浏览器:mousewheel事件 火狐浏览器:DomMouseScroll事件
    滚轮滚动的方向 
        谷歌浏览器event.deltaY>0代表滚轮向下滚动 event.deltaY<0代表滚轮向上滚动
        火狐浏览器event.detail>0代表滚轮向下滚动 event.detail<0代表滚轮向上滚动
    javascript的小数加减法会有精度问题 比如直接计算0.1+0.2会得到结果0.30000000000000004 所以在进行小数的加减法时最好先将小数转换成整数进行计算然后除以响应的倍数即可
    例如: 计算 0.1+0.2 最好写成 (0.1*10+0.2*10)/10这样就不会出现精度问题了
