<template>
    <div class='saidAboutCATS-module'>
        <p class='title'>
            That's what they said about CATS
        </p>
        <Swiper
            :autoplay='{ delay: 4000, disableOnInteraction: false }'
            class='Swiper'
            :long-swipes-ratio='0.1'
            :modules='modules'
            :pagination='true'
            slides-per-view='1'
        >
            <SwiperSlide v-for='item in list' :key='item.id'>
                <div class='item' @touchend='touchEnd' @touchstart='touchStart'>
                    <div class='info'>
                        <img alt='' :src='item.img' />
                        <p class='right'>
                            <span class='name'>
                                {{ item.name }}
                            </span>
                            <span class='label'>
                                {{ item.label }}
                            </span>
                        </p>
                    </div>
                    <p class='desc'>
                        “ {{ item.desc }} ”
                    </p>
                </div>
            </SwiperSlide>
        </Swiper>
        <img alt='' class='arrow-left' src='../../../images/home/new_version/arrow-left.png' @click='mySwipe.prev()' />
        <img alt='' class='arrow-right' src='../../../images/home/new_version/arrow-right.png' @click='mySwipe.next()' />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Pagination, Autoplay } from 'swiper'
import { Swiper } from 'swiper/vue/swiper'
import { SwiperSlide } from 'swiper/vue/swiper-slide'
import 'swiper/swiper.min.css'
import 'swiper/swiper-bundle.css'
const modules = [Pagination, Autoplay]
const list = [
    {
        id: 1, img: require('../../../images/home/new_version/user1_img.png'), name: 'Johanna Jim', label: 'introduce something', desc: 'content content content content content content content content content'
    },
    {
        id: 2, img: require('../../../images/home/new_version/user1_img.png'), name: 'Johanna Jim', label: 'introduce something', desc: 'content content content content content content content content content'
    },
    {
        id: 3, img: require('../../../images/home/new_version/user1_img.png'), name: 'Johanna Jim', label: 'introduce something', desc: 'content content content content content content content content content'
    }
]
</script>

<style lang="scss" scoped>
.saidAboutCATS-module {
    background: #242424;
    color: #FFFFFF;
    padding: 0 rem(32px) rem(80px);
    position: relative;
    .title {
        line-height: rem(66px);
        font-size: rem(56px);
        font-weight: bold;
        text-align: center;
        padding: rem(96px) 0;
        color: #FFFFFF;
    }
    .item{
        padding: 0 rem(92px);
        text-align: center;
        margin-bottom: rem(40px);
        .info{
            display: flex;
            align-items: center;
            text-align: left;
            padding-bottom: rem(40px);
            .name{
                display: block;
                font-size: rem(32px);
                font-weight: 600;
                line-height: rem(48px);
            }
            .label{
                color: #AAAAAA ;
                line-height: rem(36px);
                font-size: rem(28px);
                font-weight: 400;
            }
            img{
                margin-right: rem(16px);
                width: rem(72px);
            }
        }
        .desc{
            line-height: rem(33px);
            font-size: rem(28px);
        }
    }
    :deep(.swiper-pagination){
        bottom: 0;
    }
    .arrow-left,.arrow-right{
        width: rem(64px);
        position: absolute;
        top: 50%;
    }
    .arrow-left{
        left: rem(14px);
    }
    .arrow-right{
        right: rem(14px);
    }
}
</style>
