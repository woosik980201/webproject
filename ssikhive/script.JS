/* ========================================================
   SSIKHIVE — script.js  (STEP 4)
   6가지 기능: 다크모드 / 스크롤 등장 / 필터 / 검색 / 좋아요 / 모달
   * 모든 동작은 jQuery로 작성. 핵심마다 "순수 JS 비교" 주석을 달았음.
   ======================================================== */

// $(function () { ... }) = "문서가 다 준비되면 실행해라"
// 순수 JS라면: document.addEventListener('DOMContentLoaded', () => { ... })
$(function () {

  /* ====== 0) 공통: 토스트 알림 만들기 ====== */
  // 알림 박스를 JS로 하나 만들어 body 끝에 붙여둠 (HTML에 안 넣어도 됨)
  const $toast = $('<div class="toast"></div>').appendTo('body');
  let toastTimer;
  function showToast(message) {
    $toast.text(message).addClass('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      $toast.removeClass('show');
    }, 1800);
  }


  /* ====== 1) 다크모드 토글 (localStorage 로 기억) ====== */
  const DARK_KEY = 'ssikhive-dark';

  // (1) 새로고침해도 유지: 저장된 값이 'on'이면 바로 다크모드 적용
  if (localStorage.getItem(DARK_KEY) === 'on') {
    $('body').addClass('dark');
    $('#darkToggle').text('☀️');
  }

  // (2) 버튼 클릭 → 다크 켜고/끄고 + 아이콘 변경 + 저장
  $('#darkToggle').on('click', function () {
    // 순수 JS라면: document.body.classList.toggle('dark')
    $('body').toggleClass('dark');

    const isDark = $('body').hasClass('dark');
    $(this).text(isDark ? '☀️' : '🌙');
    localStorage.setItem(DARK_KEY, isDark ? 'on' : 'off');
  });


  /* ====== 2) 스크롤 등장 애니메이션 (Scroll Reveal) — 카드 순차 등장 ====== */
  // 섹션뿐 아니라 카드 하나하나까지 .reveal 대상에 포함 (JS로 붙여서 안전)
  const $reveals = $('.section, .hero-img, .card-wrap, .read-item').addClass('reveal');

  // 같은 그룹 안의 카드들이 "하나씩 차례로" 뜨도록 순서대로 약간씩 지연(delay)을 줌
  $('.card-grid').each(function () {
    $(this).children('.card-wrap').each(function (i) {
      $(this).css('transition-delay', (i * 0.1) + 's'); // 0s, 0.1s, 0.2s...
    });
  });
  $('.reads-text').children('.read-item').each(function (i) {
    $(this).css('transition-delay', (i * 0.1) + 's');
  });

  function revealOnScroll() {
    const winBottom = $(window).scrollTop() + $(window).height();
    $('.reveal').not('.show').each(function () {
      // 화면 아래끝에 닿기 직전(-80)부터 등장 시작 → 올라오는 과정이 눈에 보임
      if (winBottom > $(this).offset().top - 80) {
        $(this).addClass('show');
      }
    });
  }
  $(window).on('scroll resize', revealOnScroll);
  revealOnScroll(); // 처음에 이미 보이는 영역 먼저 처리


  /* ====== 3) 카테고리 필터  +  4) 실시간 검색 ====== */
  // 필터 대상 = data-category 가 있는 카드(Platforms·Reads·Youtube)
  const $items = $('[data-category]');

  // 필터(칩)와 검색(입력)을 "함께" 반영하는 하나의 함수
  function applyFilter() {
    const cat = $('.chip.active').data('filter');          // all / fashion / music / culture
    const term = $('#searchInput').val().trim().toLowerCase();
    let visible = 0;

    $items.each(function () {
      const $item = $(this);
      const matchCat = (cat === 'all') || ($item.data('category') === cat);
      const matchText = (term === '') || $item.text().toLowerCase().includes(term);

      if (matchCat && matchText) {
        $item.fadeIn(200);   // 조건 맞으면 보이기 (Fade)
        visible++;
      } else {
        $item.fadeOut(200);  // 아니면 숨기기 (Fade)
      }
    });

    // 결과가 하나도 없으면 "검색 결과가 없습니다" 표시
    $('#noResults').prop('hidden', visible !== 0);
  }

  // 칩 클릭 → 활성 칩 바꾸고 다시 필터
  $('.chip').on('click', function () {
    $('.chip').removeClass('active');
    $(this).addClass('active');
    applyFilter();
  });

  // 검색창 타이핑할 때마다 실시간 필터
  $('#searchInput').on('keyup', applyFilter);


  /* ====== 5) 좋아요 / 북마크 (localStorage) ====== */
  const LIKE_KEY = 'ssikhive-likes';
  // 저장된 좋아요 목록을 배열로 불러옴 (없으면 빈 배열)
  let likes = JSON.parse(localStorage.getItem(LIKE_KEY) || '[]');

  // 현재 likes 상태를 화면에 그려주는 함수
  function renderLikes() {
    $('.like-btn').each(function () {
      const id = $(this).data('id');
      if (likes.includes(id)) {
        $(this).addClass('active').text('♥');   // 채워진 하트
      } else {
        $(this).removeClass('active').text('♡'); // 빈 하트
      }
    });
    $('#savedCount').text(likes.length); // 헤더의 저장 개수
  }
  renderLikes(); // 새로고침 시에도 저장상태 복원

  // 하트 클릭 → 목록에 추가/제거 → 저장 → 다시 그리기
  $('.like-btn').on('click', function () {
    const id = $(this).data('id');
    if (likes.includes(id)) {
      likes = likes.filter(function (x) { return x !== id; }); // 해제
    } else {
      likes.push(id);                 // 저장
      showToast('저장되었습니다 ♥');
    }
    localStorage.setItem(LIKE_KEY, JSON.stringify(likes));
    renderLikes();
  });

  // 헤더 ♥ 버튼 → 저장 개수 알려주기
  $('#savedBtn').on('click', function () {
    showToast(likes.length ? ('저장한 항목 ' + likes.length + '개 ♥') : '아직 저장한 항목이 없어요');
  });


  /* ====== 6) 카드 상세 모달 ====== */
  const $modal = $('#modal');

  // 카드 클릭 → 외부 링크로 바로 안 가고, 모달에 정보 채워서 열기
  $('.platform-card, .media-card, .interest-card').on('click', function (e) {
    e.preventDefault(); // 기본 동작(링크 이동) 막기

    const $card = $(this);
    const img = $card.find('img').attr('src');
    const title = $card.find('h3').text();
    const desc = $card.find('p').text();
    const link = $card.attr('href');

    // 클릭한 카드의 내용을 모달에 그대로 옮겨 담음
    $modal.find('.modal-img').attr('src', img).attr('alt', title);
    $modal.find('.modal-title').text(title);
    $modal.find('.modal-desc').text(desc);
    $modal.find('.modal-link').attr('href', link);

    $modal.addClass('open').removeAttr('hidden'); // 열기 (CSS가 Fade)
  });

  // 닫기: X 버튼 또는 바깥 어두운 영역 클릭
  function closeModal() {
    $modal.removeClass('open');
  }
  $('.modal-close, .modal-overlay').on('click', closeModal);

  // ESC 키로도 닫기 (작은 디테일이지만 UX 점수)
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

});