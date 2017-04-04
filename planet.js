window.onload=function(){
 	
	function $(id){
		return document.getElementById(id);
	}
	
	
	//拖拽函数,待拖动的movedElem应在html文件中显式嵌入样式style="width:px;height:px;"
	//事件绑定在targetElem上
	//调用方法为dragDrop(movedElem,targetElem);
	function dragDrop(movedElem,targetElem){
		targetElem.onmousedown=function(e){
			var elem=movedElem,
				event=e||window.event,
				disX=parseFloat(event.pageX)-parseFloat(elem.offsetLeft),
				disY=parseFloat(event.pageY)-parseFloat(elem.offsetTop),
				valid_x=document.documentElement.clientWidth-elem.offsetWidth,
				valid_y=document.documentElement.clientHeight-elem.offsetHeight;
				
			document.onmousemove=function(event){
				var _top=parseFloat(event.pageY)-disY,
					_left=parseFloat(event.pageX)-disX;
				elem.style.top= _top>0 ? _top<valid_y ? _top+"px" : valid_y : 0+"px" ;
				elem.style.left= _left>0 ? _left<valid_x ? _left+"px" : valid_x : 0+"px" ;
				return false;
			}
			document.onmouseup=function(){
				this.onmousemove = null;
				this.onmouseup = null;
				return false;
			}
		}
		return false;
	}
	
	dragDrop($("message"),$("message").getElementsByClassName("head")[0]);
	dragDrop($("state"),$("state").getElementsByClassName("head")[0]);
	dragDrop($("operate"),$("operate").getElementsByClassName("head")[0]);
	
	
	//介质,包含信息,飞船和基地都可从此处取得信息
	//有一定概率信息丢失
	//信息以数组形式发送及存储
	//发送格式为this.send([track,message])
	//存储格式为this.message=[track,message]
	//track为数字(轨道编号0,1,2),message为字符串
	function Medium(){
		this.message=[];
		this.plp=0.1;		//信号丢失概率
	}
	Medium.prototype={
		constructor:Medium,
		send:function(msg){
			var time=msg[0]+1,		//不同轨道不同延时
				that=this,
			delay=setInterval(function(){
				time--;
				if(time<0){
					clearInterval(delay);
					var isLost=Math.random()<that.plp;
					if(isLost){
						that.message=[];
						return that;
					}
					else{
						that.message=msg;
						return that;
					}
				}
			},10);
		}
	}
	var baseinbox=new Medium();		//基地收件箱
	var shipinbox=new Medium();		//飞船收件箱
	
	
	/*********************/
	/*****飞船原型实例****/
	/*********************/
	function Ship(track){
		this.track=track;		//轨道(0,1,2,3)
		this.ship=$("ship"+this.track);	//飞船所在的div
		//飞船类型(0,1,2)
		this.shipType=$("operate").getElementsByClassName("track")[this.track].getElementsByClassName("ship")[0].selectedIndex;
		//能量类型(0,1,2)
		this.energyType=$("operate").getElementsByClassName("track")[this.track].getElementsByClassName("energy")[0].selectedIndex;
		this.speed=(new Array(3,5,8))[this.shipType];		//飞船速度
		this.consume=(new Array(5,7,9))[this.shipType];		//能耗速度
		this.charge=(new Array(4,6,8))[this.energyType];	//充电速度
		this.energy=100;				//剩余能量
		this.degree=0;					//已旋转角度
		
		this.flying=-1;					//飞行时setInterval延时函数的id变量
		this.stopping=-1;				//停止时setInterval延时函数的id变量
		
		this.state=0;		//0:未创建..1:转动中..2:停止
	}
	Ship.prototype={
		constructor:Ship,
		//初始化,始终循环从飞船收件箱中取命令
		//没有命令就继续取,有便执行,执行完后继续取
		init:function(){
			var that=this,
				loop=setInterval(function(){
					that.getOrder();
					var order=that.getOrder();
					if(order){
						switch(order){
							case "stop":
								if(that.state==1){
									that.stop();
									that.state=2;
								}
								that.send(order);
								break;
							case "build":
								that.build();
								that.state=2;
								that.send(order);
								break;
							case "launch":
								if(that.state==2){
									that.launch();
									that.state=1;
								}
								that.send(order);
								break;
							case "destroy":
								if(that.state==1 || that.state==2){
									that.destroy();
									that.state=0;
								}
								that.send(order);
								break;
						}
					}
			},1);
		},
		
		//创建飞船,鬼知道我为什么没用create而用build...
		build:function(){
			clearInterval(this.flying);
			clearInterval(this.stopping);
			this.energy=100;
			this.degree=0;
			//飞船类型(0,1,2)
			this.shipType=$("operate").getElementsByClassName("track")[this.track].getElementsByClassName("ship")[0].selectedIndex;
			//能量类型(0,1,2)
			this.energyType=$("operate").getElementsByClassName("track")[this.track].getElementsByClassName("energy")[0].selectedIndex;
			this.speed=(new Array(3,5,8))[this.shipType];		//飞船速度
			this.consume=(new Array(5,7,9))[this.shipType];		//能耗速度
			this.charge=(new Array(4,6,8))[this.energyType];	//充电速度
			this.setDeg(this.ship,this.degree);
			this.enable(this.ship);
			return this;
		},
		
		launch:function(){
			clearInterval(this.stopping);
			var that=this;
			this.flying=setInterval(function(){
				that.degree+=that.speed/10;
				that.energy-=that.consume/10;
				that.energy+=that.charge/10;
				that.degree>360 && (that.degree=0) ;
				that.energy<0 && (that.energy=0) ;
				that.energy>100 && (that.energy=100) ;
				that.setDeg(that.ship,that.degree);
			},10);
			return that;	
		},
		
		stop:function(){
			var that=this;
			clearInterval(that.flying);
			that.stopping=setInterval(function(){
				that.energy+=that.charge/10;
				that.energy>100 && (that.energy=100) && (clearInterval(that.stopping)) ;
			},10);
			return that;
		},
		
		destroy:function(){
			var that=this;
			clearInterval(that.flying);
			clearInterval(that.stopping);
			that.disable(that.ship);
			return that;
		},
		
		
		
		
		//编码,输入待编码字符串,返回加密后的字符串
		enCode:function(message){
			var temp="",
				ensecret={a:"q",b:"w",c:"e",d:"r",e:"t",f:"y",g:"u",h:"i",i:"o",j:"p",k:"a",l:"s",m:"d",n:"f",o:"g",p:"h",q:"j",r:"k",s:"l",t:"z",u:"x",v:"c",w:"v",x:"b",y:"n",z:"m"};
			for(var i=0,len=message.length;i<len;i++){
				temp+=ensecret[message[i]];
			}
			return temp;
		},
		//解码,输入待解码字符串,返回解码后的字符串
		deCode:function(message){
			var temp="",
				desecret={q:"a",w:"b",e:"c",r:"d",t:"e",y:"f",u:"g",i:"h",o:"i",p:"j",a:"k",s:"l",d:"m",f:"n",g:"o",h:"p",j:"q",k:"r",l:"s",z:"t",x:"u",c:"v",v:"w",b:"x",n:"y",m:"z"};
			for(var i=0,len=message.length;i<len;i++){
				temp+=desecret[message[i]];
			}
			return temp;
		},
		
		//以约定格式将原始数据(this.track,message)送到baseinbox
		send:function(message){
			baseinbox.send([this.track,this.enCode(message+"true")]);
			return false;
		},

		//检查shipinbox,如有本飞船的命令,则返回该命令内容
		//没有,则返回false
		getOrder:function(){
			if(shipinbox.message[0]==this.track){
				return this.deCode(shipinbox.message[1]);
			}
			return false;
		},
		
		
		
		
		
		
		
		
		
		
		//兼容性为elem添加旋转deg角度
		setDeg:function(elem,deg){
			elem.style.transform="rotate("+deg+"deg)" ;
			elem.style.OTransform="rotate("+deg+"deg)" ;
			elem.style.MozTransform="rotate("+deg+"deg)" ;
			elem.style.msTransform="rotate("+deg+"deg)" ;
			elem.style.webkitTransform="rotate("+deg+"deg)" ;
		},
		//为节点elem切换某个类名;(有变没有，没有变有)
		switchClass:function(elem,className){
			var	arr=elem.className.split(" "),
				hasClassName=false;
			for(var i in arr){
				if(arr[i]==className){
					arr[i]="";
					hasClassName=true;
				}
			}
			if(!hasClassName){
				arr.push(className);
			}
			elem.className=arr.join(" ");
			return true;
		},
		//为节点elem在某两个类名间切换,类名不得为空;
		switchClasses:function(elem,className1,className2){
			if(!className1 || !className2){
				console.warn("switchClasses()失败,类名不得为空.");
				return false;
			}
			var	arr=elem.className.split(" "),
					hasClassName1=false,
					hasClassName2=false;
			for(var i in arr){
				if(arr[i]==className1){
					arr[i]=className2;
					hasClassName1=true;
				}
			}
			if(!hasClassName1){
				for(var i in arr){
					if(arr[i]==className2){
						arr[i]=className1;
						hasClassName2=true;
					}
				}
				if(!hasClassName2){
					console.warn("switchClasses()失败,两个类名均不存在.");
					return false;
				}
			}
			elem.className=arr.join(" ");
			return true;
		},
		//为节点elem添加某个类名
		addClass:function(elem,className){
			if(!className){
				console.warn("addClass()失败,类名不得为空.");
				return false;
			}
			var	arr=elem.className.split(" ");
			for(var i in arr){
				if(arr[i]==className){
					console.warn("addClass()失败,该类名已存在.");
					return false;
				}
			}
			arr.push(className);
			elem.className=arr.join(" ");
			return true;
		},
		//为节点elem删除某个类名
		delClass:function(elem,className){
			if(!className){
				console.warn("delClass()失败,类名不得为空.");
				return false;
			}
			var arr=elem.className.split(" ");
			for(var i in arr){
				if(arr[i]==className){
					arr.splice(i,1);
					elem.className=arr.join(" ");
					return true;
				}
			}
			console.warn("delClass()失败,不存在该类名");
			return false;
		},

		//仅适用此原型
		enable:function(elem){
			this.delClass(elem,"disable");
			this.addClass(elem,"able");
			elem.onmousedown=null;
		},
		//仅适用此原型
		disable:function(elem){
			this.delClass(elem,"able");
			this.addClass(elem,"disable");
			elem.onmousedown=function(){
				return false;
			}
		}
		
	}
	
	
	
	/*********************/
	/*****基地原型实例****/
	/*********************/
	function Basement(){
		
	}
	Basement.prototype={
		constructor:Basement,
		
		//编码,输入待编码字符串,返回加密后的字符串
		enCode:function(message){
			var temp="",
				ensecret={a:"q",b:"w",c:"e",d:"r",e:"t",f:"y",g:"u",h:"i",i:"o",j:"p",k:"a",l:"s",m:"d",n:"f",o:"g",p:"h",q:"j",r:"k",s:"l",t:"z",u:"x",v:"c",w:"v",x:"b",y:"n",z:"m"};
			for(var i=0,len=message.length;i<len;i++){
				temp+=ensecret[message[i]];
			}
			return temp;
		},
		//解码,输入待解码字符串,返回解码后的字符串
		deCode:function(message){
			if(!message){
				return "";
			}
			var temp="",
				desecret={q:"a",w:"b",e:"c",r:"d",t:"e",y:"f",u:"g",i:"h",o:"i",p:"j",a:"k",s:"l",d:"m",f:"n",g:"o",h:"p",j:"q",k:"r",l:"s",z:"t",x:"u",c:"v",v:"w",b:"x",n:"y",m:"z"};
			for(var i=0,len=message.length;i<len;i++){
				temp+=desecret[message[i]];
			}
			return temp;
		},
		
		//以约定格式将原始数据(track,message)送到shipinbox
		send:function(track,message){
			shipinbox.send([track,this.enCode(message)]);
			return false;
		},
		//检查某个原始数据(track,message)是否得到回应
		isAck:function(track,message){
			if(baseinbox.message.length>0){
				return (baseinbox.message[0]==track && this.deCode(baseinbox.message[1])==message+"true");
			}
			return false;
		},

		//向track轨道的飞船发送order命令,每20ms检测是否有ack,没有则继续发送
		sendOrder:function(track,order){
			var that=this,
				loop=setInterval(function(){
				that.send(track,order);
				that.isAck(track,order);
				var isAck=that.isAck(track,order);
				if(isAck){
					var num=baseinbox.message[0];
					switch(that.deCode(baseinbox.message[1])){
						case "buildtrue":
							that.enableElem($("operate").getElementsByClassName("track")[num]);
							break;
						case "destroytrue":
							that.disableElem($("operate").getElementsByClassName("track")[num]);
							break;
						default :
							break;
					}
					clearInterval(loop);
				}
			},20);
		},
		
		//向消息窗打印消息
		print:function(){
			//不想写了,要写的话还得修改信息格式...
		},
		
		//为节点elem添加某个类名
		addClass:function(elem,className){
			if(!className){
				console.warn("addClass()失败,类名不得为空.");
				return false;
			}
			var	arr=elem.className.split(" ");
			for(var i in arr){
				if(arr[i]==className){
					console.warn("addClass()失败,该类名已存在.");
					return false;
				}
			}
			arr.push(className);
			elem.className=arr.join(" ");
			return true;
		},
		//为节点elem删除某个类名
		delClass:function(elem,className){
			if(!className){
				console.warn("delClass()失败,类名不得为空.");
				return false;
			}
			var arr=elem.className.split(" ");
			for(var i in arr){
				if(arr[i]==className){
					arr.splice(i,1);
					elem.className=arr.join(" ");
					return true;
				}
			}
			console.warn("delClass()失败,不存在该类名");
			return false;
		},

		//仅适用此原型,用到了delClass(),addClass()
		enable:function(elem){
			this.delClass(elem,"disable");
			this.addClass(elem,"able");
			elem.onmousedown=null;
		},
		//仅适用此原型,用到了delClass(),addClass()
		disable:function(elem){
			this.delClass(elem,"able");
			this.addClass(elem,"disable");
			elem.onmousedown=function(){
				return false;
			}
		},
		//仅适用此原型,用到了enable(),disabel()
		enableElem:function(elem){
			var child=elem.childNodes;
			for(var i=0,len=child.length;i<len;i++){
				if(child[i].nodeType==1){
					this.enable(child[i]);
				}
			}
		},
		//仅适用此原型,disabel(elem)所有子元素,并enable($(".build"));
		disableElem:function(elem){
			var child=elem.childNodes;
			for(var i=0,len=child.length;i<len;i++){
				if(child[i].nodeType==1){
					this.disable(child[i]);
				}
			}
			this.enable(elem.getElementsByClassName("build")[0]);
		},
		//基地按钮事件处理程序
		handler:function(e){
			var event= e || window.event;
			if(event.target.className.indexOf("disable")>=0){
				return false;
			}
			var track=event.target.getAttribute("index"),
				order=function(){
					if(event.target.className.indexOf("stop")>=0) return "stop";
					if(event.target.className.indexOf("build")>=0) return "build";
					if(event.target.className.indexOf("launch")>=0) return "launch";
					if(event.target.className.indexOf("destroy")>=0) return "destroy";
				}();
			basement.sendOrder(track,order);
		},
		//基地初始化,为按钮绑定事件(事件委托在ul上)
		init:function(){
			var ul=$("operate").getElementsByTagName("ul")[0];
			ul.onclick=this.handler;
		}
		
}
 	
 	
 	
	//初始化飞船及基地
	var ship1=new Ship(0),
		ship2=new Ship(1),
		ship3=new Ship(2),
		ship4=new Ship(3),
		
		basement=new Basement();
	
	basement.init();
	
	ship1.init();
	ship2.init();
	ship3.init();
	ship4.init();
	 	
 	
}
